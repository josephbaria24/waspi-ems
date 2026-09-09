// app/api/register/route.ts
import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { getMembershipSettings } from '@/lib/membership-settings-store'
import { getPlan } from '@/lib/membership-settings'
import { sendRegistrationEmail } from '@/lib/send-registration-email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      password,
      membershipType,
      address,
      city,
      state,
      zipCode,
      organization,
      paymentMethod,
      cardNumber,
      cardExpiry,
      cardCVC,
      cardName,
      wantsPhysicalId,
      deliveryRecipient,
      deliveryAddress,
      deliveryCity,
      deliveryProvince,
      deliveryZip,
    } = body

    const membershipSettings = await getMembershipSettings()
    const selectedPlan = getPlan(membershipSettings, membershipType)
    const membershipAmount = selectedPlan.price
    const physicalIdFee = wantsPhysicalId ? membershipSettings.physicalIdFee : 0
    const shippingFee = wantsPhysicalId ? membershipSettings.shippingFee : 0
    const amountDue = membershipAmount + physicalIdFee + shippingFee

    console.log('Registration attempt for:', email)

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !membershipType) {
      console.log('Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      console.log('Password too short')
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists - use admin to list users
    console.log('Checking if user exists...')
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      // Continue anyway - the createUser will catch duplicate emails
    }

    const existingUser = existingUsers?.users?.find(user => user.email?.toLowerCase() === email.toLowerCase())
    
    if (existingUser) {
      console.log('User already exists')
      const { data: existingMember } = await supabaseAdmin
        .from("members")
        .select("tracking_number")
        .eq("profile_id", existingUser.id)
        .maybeSingle()

      const tracking = existingMember?.tracking_number as string | undefined
      if (tracking) {
        return NextResponse.json({
          success: true,
          alreadyRegistered: true,
          trackingNumber: tracking,
          message: "This email is already registered. Use the tracking number below to upload your receipt.",
        })
      }

      return NextResponse.json(
        { error: "This email is already registered. Sign in or use a different email." },
        { status: 400 }
      )
    }

    // Create auth user with the provided password
    console.log('Creating auth user...')
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: firstName,
        last_name: lastName
      }
    })

    if (authError || !authData.user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: authError?.message || 'Failed to create user account' },
        { status: 500 }
      )
    }

    const userId = authData.user.id
    console.log('Auth user created with ID:', userId)

    // Create profile
    console.log('Creating profile...')
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        full_name: `${firstName} ${lastName}`,
        phone_number: phone,
        date_of_birth: dateOfBirth || null,
        address,
        city,
        zip_code: zipCode,
        company: organization?.trim() || null,
        // Remove state and membership_type from profiles as they aren't in your schema
      })

    if (profileError) {
      console.error('Profile error:', profileError)
      // Clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: `Failed to create profile: ${profileError.message}` },
        { status: 500 }
      )
    }
    console.log('Profile created')

    // Create membership record
    const trackingNumber = `WASPI-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
    console.log('Creating membership tracking number:', trackingNumber)
    
    const paymentDetails = {
      method: paymentMethod || 'Pending',
      membership_type: membershipType,
      membership_amount: membershipAmount,
      wants_physical_id: Boolean(wantsPhysicalId),
      physical_id_fee: physicalIdFee,
      shipping_fee: shippingFee,
      amount_due: amountDue,
      delivery: wantsPhysicalId
        ? {
            recipient: deliveryRecipient,
            address: deliveryAddress,
            city: deliveryCity,
            province: deliveryProvince,
            zip: deliveryZip,
          }
        : null,
    }

    const { error: membershipError } = await supabaseAdmin
      .from('members')
      .insert({
        profile_id: userId,
        membership_type: membershipType,
        status: 'Pending',
        payment_status: 'Pending',
        payment_method: paymentMethod || 'Pending',
        payment_details: paymentDetails,
        tracking_number: trackingNumber,
      })

    if (membershipError) {
      console.error('Membership error:', membershipError)
      return NextResponse.json(
        { error: `Failed to create membership: ${membershipError.message}` },
        { status: 500 }
      )
    }
    console.log('Membership created')

    // Create application record
    console.log('Creating application record...')
    const { error: applicationError } = await supabaseAdmin
      .from('applications')
      .insert({
        user_id: userId,
        registered: true,
      })

    if (applicationError) {
      console.error('Application error:', applicationError)
      // Don't fail registration if this fails
    }

    // Log the payment information (without storing actual card details)
    console.log('Logging payment...')
    const { error: paymentLogError } = await supabaseAdmin
      .from('payment_logs')
      .insert({
        user_id: userId,
        email,
        provider: paymentMethod || 'bank',
        event_type: 'registration_initiated',
        amount: amountDue,
        currency: 'php',
        raw: {
          method: paymentMethod,
          membership_amount: membershipAmount,
          wants_physical_id: Boolean(wantsPhysicalId),
          physical_id_fee: physicalIdFee,
          shipping_fee: shippingFee,
          delivery: wantsPhysicalId
            ? {
                recipient: deliveryRecipient,
                address: deliveryAddress,
                city: deliveryCity,
                province: deliveryProvince,
                zip: deliveryZip,
              }
            : null,
          masked_card: cardNumber ? cardNumber.slice(-4) : null,
        },
      })

    if (paymentLogError) {
      console.error('Payment log error:', paymentLogError)
      // Don't fail registration if this fails
    }

    // Audit log
    console.log('Creating audit log...')
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: 'user_registration',
        details: {
          email,
          membership_type: membershipType,
          wants_physical_id: Boolean(wantsPhysicalId),
          physical_id_fee: physicalIdFee,
          shipping_fee: shippingFee,
          amount_due: amountDue,
          delivery_address: wantsPhysicalId
            ? `${deliveryRecipient}, ${deliveryAddress}, ${deliveryCity}, ${deliveryProvince} ${deliveryZip}`
            : null,
          timestamp: new Date().toISOString(),
        },
      })

    void sendRegistrationEmail({
      email,
      fullName: `${firstName} ${lastName}`.trim(),
      trackingNumber,
      membershipType,
      paymentMethod,
      wantsPhysicalId: Boolean(wantsPhysicalId),
      physicalIdFee,
      shippingFee,
      totalDue: amountDue,
      deliveryAddress: wantsPhysicalId
        ? [deliveryRecipient, deliveryAddress, deliveryCity, deliveryProvince, deliveryZip].filter(Boolean).join(", ")
        : "",
    }).catch((emailError) => {
      console.error('Registration email error:', emailError)
    })

    console.log('Registration successful for:', email)
    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful',
        userId,
        trackingNumber: trackingNumber,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}