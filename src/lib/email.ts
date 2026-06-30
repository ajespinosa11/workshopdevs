import nodemailer from 'nodemailer'

interface SendEmailParams {
  to: string
  customerName: string
  voucherCode: string
  planName: string
  creditHours: number
}

export async function sendVoucherEmail({ to, customerName, voucherCode, planName, creditHours }: SendEmailParams) {
  let transporter: nodemailer.Transporter

  // Check if SMTP environment variables exist, otherwise create an Ethereal test account
  const useSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  let previewUrl = ''

  if (useSmtp) {
    const host = process.env.SMTP_HOST?.replace(/^["']|["']$/g, '').trim()
    const portStr = process.env.SMTP_PORT?.toString().replace(/^["']|["']$/g, '').trim()
    const secureStr = process.env.SMTP_SECURE?.toString().replace(/^["']|["']$/g, '').trim()
    const user = process.env.SMTP_USER?.replace(/^["']|["']$/g, '').trim()
    const pass = process.env.SMTP_PASS?.replace(/^["']|["']$/g, '').replace(/\s+/g, '')

    transporter = nodemailer.createTransport({
      host,
      port: parseInt(portStr || '587', 10),
      secure: secureStr === 'true',
      auth: {
        user,
        pass,
      },
    })
  } else {
    // Generate Ethereal test account for local development
    console.log('Generating Ethereal SMTP test account for email delivery...')
    const testAccount = await nodemailer.createTestAccount()
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })
  }

  const hostUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Workshop Voucher Code</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          background-color: #f4f6f8;
          color: #1a202c;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
          overflow: hidden;
        }
        .header {
          background-color: #0f2540;
          color: #ffffff;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .header p {
          margin: 5px 0 0 0;
          opacity: 0.9;
          font-size: 14px;
        }
        .content {
          padding: 40px 30px;
          line-height: 1.6;
        }
        .greeting {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .details-box {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin: 25px 0;
        }
        .voucher-highlight {
          text-align: center;
          margin: 15px 0;
        }
        .voucher-code {
          display: inline-block;
          font-family: 'Courier New', Courier, monospace;
          font-size: 28px;
          font-weight: 700;
          color: #f97316;
          background: #fff5eb;
          border: 2px dashed #f97316;
          padding: 10px 25px;
          border-radius: 6px;
          letter-spacing: 1px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #edf2f7;
          padding: 8px 0;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          font-weight: 600;
          color: #4a5568;
        }
        .info-value {
          color: #1a202c;
        }
        .cta-container {
          text-align: center;
          margin-top: 30px;
        }
        .cta-button {
          display: inline-block;
          background-color: #f97316;
          color: #ffffff !important;
          font-weight: 700;
          text-decoration: none;
          padding: 12px 30px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(249, 115, 22, 0.2);
          transition: background-color 0.2s;
        }
        .cta-button:hover {
          background-color: #ea580c;
        }
        .footer {
          background-color: #f8fafc;
          border-top: 1px solid #edf2f7;
          padding: 20px 30px;
          text-align: center;
          font-size: 12px;
          color: #718096;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Makerlab 3D Workshop</h1>
          <p>Your Payment & Voucher Details</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${customerName},</div>
          <p>Thank you for your purchase! We are excited to welcome you to our workshop. Your payment has been successfully processed, and your workshop voucher is now active.</p>
          
          <div class="details-box">
            <div class="info-row">
              <span class="info-label">Plan Purchased:</span>
              <span class="info-value"><strong>${planName}</strong></span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Units:</span>
              <span class="info-value">${creditHours} units</span>
            </div>
            
            <div class="voucher-highlight">
              <p style="margin-bottom: 5px; font-weight: 600; color: #4a5568;">Your Unique Voucher Code:</p>
              <div class="voucher-code">${voucherCode}</div>
            </div>
          </div>
          
          <p>To schedule your workshop seat, please click the button below to book a session. Make sure to enter your voucher code during checkout.</p>
          
          <div class="cta-container">
            <a href="${hostUrl}/book-session" class="cta-button">Book a Session Now</a>
          </div>
        </div>
        <div class="footer">
          <p>Please note: Voucher units are deducted only when you physically check-in for your session.</p>
          <p>&copy; ${new Date().getFullYear()} Makerlab Workshop. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Makerlab 3D Workshop" <no-reply@makerlab3d.com>',
    to,
    subject: `Your Makerlab Workshop Voucher: ${voucherCode}`,
    html: htmlContent,
  }

  const info = await transporter.sendMail(mailOptions)

  if (!useSmtp) {
    previewUrl = nodemailer.getTestMessageUrl(info) || ''
    console.log(`[Ethereal Email Sent] Preview URL: ${previewUrl}`)
  }

  return {
    success: true,
    messageId: info.messageId,
    previewUrl,
  }
}
