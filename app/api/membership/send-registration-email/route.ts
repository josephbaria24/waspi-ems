import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const body = await req.json();
    const {
        email,
        fullName,
        trackingNumber,
        membershipType,
        paymentMethod,
    } = body;

    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.hostinger.com",
            port: 465,
            secure: true,
            auth: {
                user: "no-reply@waspi.ph",
                pass: "@Notsotrickypassword123",
            },
        });

        const priceMap: Record<string, string> = {
            standard: "₱100.00",
            premium: "₱150.00",
            elite: "₱300.00",
        };

        const typeMap: Record<string, string> = {
            standard: "Student Member",
            premium: "Professional Member",
            elite: "Organizational Member",
        };

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://waspi.ph";
        const uploadReceiptUrl = `${siteUrl}/membership/upload-receipt?tracking=${trackingNumber}`;

        const showUploadSection = paymentMethod === "ewallet" || paymentMethod === "bank";

        const html = `
        <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;font-family:'Segoe UI',Arial,sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
            
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#16a35c,#059669);padding:40px 30px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:-0.5px;">Welcome to WASPI!</h1>
                <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">Your membership registration has been received</p>
            </div>

            <!-- Body -->
            <div style="padding:30px;">

                <p style="font-size:16px;color:#333;">Hi <strong>${fullName}</strong>,</p>

                <p style="font-size:14px;color:#555;line-height:1.6;">
                    Thank you for registering as a member of <strong>WASPI</strong> (Women in Architecture, Science and Project Initiatives). 
                    Your application has been submitted and is pending payment confirmation.
                </p>

                <!-- Tracking Number Box -->
                <div style="background:#f0fdf4;border:2px dashed #16a35c;border-radius:10px;padding:20px;text-align:center;margin:24px 0;">
                    <p style="font-size:12px;color:#777;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px;">Your Tracking Number</p>
                    <p style="font-size:28px;font-weight:bold;color:#16a35c;margin:0;font-family:'Courier New',monospace;">${trackingNumber}</p>
                    <p style="font-size:12px;color:#999;margin:8px 0 0;">Please save this number for your records</p>
                </div>

                <!-- Membership Details -->
                <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin:20px 0;">
                    <p style="font-size:13px;color:#777;margin:0 0 12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Registration Details</p>
                    <table style="width:100%;font-size:14px;color:#444;" cellpadding="4" cellspacing="0">
                        <tr>
                            <td style="color:#888;width:130px;">Membership</td>
                            <td style="font-weight:600;">${typeMap[membershipType] || membershipType}</td>
                        </tr>
                        <tr>
                            <td style="color:#888;">Amount Due</td>
                            <td style="font-weight:600;color:#16a35c;">${priceMap[membershipType] || "—"}</td>
                        </tr>
                        <tr>
                            <td style="color:#888;">Payment Method</td>
                            <td>${paymentMethod === "ewallet" ? "E-wallet (GCash/Maya)" : paymentMethod === "bank" ? "Bank Transfer" : "Cash (In-person)"}</td>
                        </tr>
                        <tr>
                            <td style="color:#888;">Status</td>
                            <td><span style="background:#FEF3C7;color:#D97706;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;">Pending Payment</span></td>
                        </tr>
                    </table>
                </div>

                ${showUploadSection ? `
                <!-- Upload Receipt CTA -->
                <div style="background:#FFFBEB;border:2px solid #F59E0B;border-radius:10px;padding:24px;margin:24px 0;text-align:center;">
                    <p style="font-size:16px;font-weight:700;color:#92400E;margin:0 0 8px;">📤 Upload Your Payment Receipt</p>
                    <p style="font-size:13px;color:#78350F;margin:0 0 16px;line-height:1.6;">
                        After completing your payment via ${paymentMethod === "ewallet" ? "GCash or Maya" : "bank transfer"}, 
                        please upload a screenshot or photo of your transaction receipt.
                    </p>
                    <a href="${uploadReceiptUrl}" style="display:inline-block;background:#F59E0B;color:#fff;padding:14px 36px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;">
                        Upload Receipt Now
                    </a>
                </div>
                ` : `
                <!-- Cash Payment Instructions -->
                <div style="background:#EFF6FF;border-left:4px solid #3B82F6;border-radius:0 8px 8px 0;padding:16px;margin:20px 0;">
                    <p style="font-size:14px;font-weight:600;color:#1E40AF;margin:0 0 8px;">💳 In-Person Payment</p>
                    <p style="font-size:13px;color:#1E3A5F;margin:0;line-height:1.8;">
                        Please visit our office to settle your payment. Bring a valid ID and mention your tracking number <strong>${trackingNumber}</strong>.
                    </p>
                </div>
                `}

                <!-- Next Steps -->
                <div style="background:#f0fdf4;border-left:4px solid #16a35c;border-radius:0 8px 8px 0;padding:16px;margin:20px 0;">
                    <p style="font-size:14px;font-weight:600;color:#166534;margin:0 0 8px;">📋 Next Steps:</p>
                    <ol style="font-size:13px;color:#14532d;margin:0;padding-left:18px;line-height:1.8;">
                        <li>Save your tracking number</li>
                        <li>Send your payment to the WASPI account</li>
                        ${showUploadSection ? '<li><strong>Upload your payment receipt</strong> using the button above</li>' : '<li>Visit our office with a valid ID</li>'}
                        <li>Wait for admin approval (usually within 24-48 hours)</li>
                    </ol>
                </div>

                <!-- Payment Details for E-wallet/Bank -->
                ${paymentMethod === "ewallet" ? `
                <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin:20px 0;">
                    <p style="font-size:13px;font-weight:600;color:#555;margin:0 0 10px;">E-wallet Payment Accounts:</p>
                    <table style="width:100%;font-size:13px;" cellpadding="4" cellspacing="0">
                        <tr>
                            <td style="color:#888;width:80px;">GCash</td>
                            <td style="font-family:'Courier New',monospace;font-weight:600;">0912 345 6789</td>
                        </tr>
                        <tr>
                            <td style="color:#888;">Maya</td>
                            <td style="font-family:'Courier New',monospace;font-weight:600;">0912 345 6789</td>
                        </tr>
                    </table>
                </div>
                ` : ''}

                ${paymentMethod === "bank" ? `
                <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin:20px 0;">
                    <p style="font-size:13px;font-weight:600;color:#555;margin:0 0 10px;">Bank Transfer Details:</p>
                    <table style="width:100%;font-size:13px;" cellpadding="4" cellspacing="0">
                        <tr><td style="color:#888;width:120px;">Bank</td><td style="font-weight:600;">BPI</td></tr>
                        <tr><td style="color:#888;">Account Name</td><td style="font-weight:600;">WASPI ORG</td></tr>
                        <tr><td style="color:#888;">Account Number</td><td style="font-family:'Courier New',monospace;font-weight:600;">1234-5678-90</td></tr>
                    </table>
                </div>
                ` : ''}

                <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">

                <p style="font-size:13px;color:#999;text-align:center;line-height:1.6;">
                    If you have any questions, please contact us at 
                    <a href="mailto:info@waspi.ph" style="color:#16a35c;">info@waspi.ph</a>
                </p>
            </div>

            <!-- Footer -->
            <div style="background:#f8f9fa;padding:16px;text-align:center;border-top:1px solid #eee;">
                <p style="font-size:11px;color:#aaa;margin:0;">
                    © ${new Date().getFullYear()} WASPI — Women in Architecture, Science and Project Initiatives
                </p>
            </div>
        </div>
        `;

        await transporter.sendMail({
            from: `"WASPI Membership" <no-reply@waspi.ph>`,
            to: email,
            subject: `Welcome to WASPI! Your Tracking Number: ${trackingNumber}`,
            html,
        });

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Registration email error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
