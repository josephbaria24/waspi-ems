'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { RegistrationForm } from '@/components/forms/registration-form'

export default function RegisterPage() {
  const [registrationComplete, setRegistrationComplete] = useState(false)

  if (registrationComplete) {
    return (
      <>
        <Header title="WASPI Registration" />
        <div className="min-h-screen bg-background px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card border-2 border-primary/20 rounded-lg p-8 text-center space-y-6 shadow-lg">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-4xl">✓</span>
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-foreground">Registration Successful!</h2>
                <p className="text-foreground/70">
                  Your membership application has been submitted. You will receive a confirmation email shortly.
                </p>
              </div>
              <div className="bg-muted/50 border border-primary/20 rounded-lg p-4 text-sm text-foreground/80 text-left">
                <p className="font-semibold text-primary mb-2">Next Steps:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Check your email for confirmation</li>
                  <li>Your membership card will be prepared</li>
                  <li>Log in to your dashboard to track status</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="WASPI Registration" />
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <RegistrationForm onSuccess={() => setRegistrationComplete(true)} />
        </div>
      </div>
    </>
  )
}
