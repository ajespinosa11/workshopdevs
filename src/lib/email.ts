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
      <title>Paid Workshop Voucher Confirmed</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f8; color: #1a202c; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; }
        .header { background: linear-gradient(135deg, #0f2540 0%, #1a3a5c 100%); color: #ffffff; padding: 36px 30px; text-align: center; }
        .header-badge { display: inline-block; background: rgba(255,255,255,0.15); border-radius: 20px; padding: 4px 14px; font-size: 12px; font-weight: 700; letter-spacing: 1px; margin-bottom: 12px; }
        .header h1 { margin: 0 0 6px; font-size: 26px; font-weight: 800; }
        .header p { margin: 0; opacity: 0.85; font-size: 14px; }
        .green-banner { background: linear-gradient(90deg, #16a34a, #22c55e); color: #fff; text-align: center; padding: 12px; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; }
        .content { padding: 36px 30px; line-height: 1.65; }
        .greeting { font-size: 20px; font-weight: 700; color: #0f2540; margin-bottom: 12px; }
        .intro-text { font-size: 15px; color: #4a5568; margin-bottom: 28px; }
        .info-card { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 22px; margin-bottom: 24px; }
        .info-card-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #718096; margin-bottom: 14px; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #edf2f7; font-size: 14px; }
        .info-row:last-child { border-bottom: none; padding-bottom: 0; }
        .info-label { color: #718096; }
        .info-value { color: #1a202c; font-weight: 600; text-align: right; max-width: 60%; }
        .ref-box { background: linear-gradient(135deg, #fff7ed, #ffedd5); border: 2px dashed #f97316; border-radius: 12px; padding: 18px 24px; text-align: center; margin-bottom: 24px; }
        .ref-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #ea580c; margin-bottom: 6px; }
        .ref-code { font-size: 22px; font-weight: 900; color: #c2410c; letter-spacing: 2px; font-family: monospace; }
        .reminder-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; }
        .reminder-box p { margin: 0 0 6px; font-size: 14px; color: #15803d; }
        .reminder-box p:last-child { margin-bottom: 0; }
        .cta-button { display: inline-block; background: #0f2540; color: #ffffff !important; text-decoration: none; padding: 14px 32px; font-weight: 700; border-radius: 8px; font-size: 15px; margin-top: 8px; }
        .footer { background: #f7fafc; padding: 20px 30px; border-top: 1px solid #edf2f7; font-size: 12px; color: #a0aec0; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-badge">PAYMENT CONFIRMED</div>
          <h1>You're All Set!</h1>
          <p>Your Paid Workshop Voucher has been activated at Makerlab Experience Hub</p>
        </div>
        <div class="green-banner">PAID WORKSHOP — VOUCHER ACTIVATED</div>
        <div class="content">
          <p class="greeting">Hello, ${customerName}!</p>
          <p class="intro-text">
            We are excited to welcome you to <strong>Makerlab Experience Hub</strong>! Your payment for the paid workshop has been successfully processed, and your workshop voucher is now active.
          </p>

          <div class="ref-box">
            <div class="ref-label">Voucher Code</div>
            <div class="ref-code">${voucherCode}</div>
          </div>

          <div class="info-card">
            <div class="info-card-title">Voucher Details</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 4px;">
              <tr>
                <td style="padding: 9px 0; color: #718096; width: 140px; font-weight: 600; vertical-align: top; border-bottom: 1px solid #edf2f7;">Plan Purchased:</td>
                <td style="padding: 9px 0; color: #1a202c; font-weight: 700; text-align: right; vertical-align: top; border-bottom: 1px solid #edf2f7;">${planName}</td>
              </tr>
              <tr>
                <td style="padding: 9px 0; color: #718096; width: 140px; font-weight: 600; vertical-align: top; border-bottom: 1px solid #edf2f7;">Total Units:</td>
                <td style="padding: 9px 0; color: #1a202c; font-weight: 700; text-align: right; vertical-align: top; border-bottom: 1px solid #edf2f7;">${creditHours} units</td>
              </tr>
              <tr>
                <td style="padding: 9px 0; color: #718096; width: 140px; font-weight: 600; vertical-align: top; border-bottom: 1px solid #edf2f7;">Status:</td>
                <td style="padding: 9px 0; color: #16a34a; font-weight: 700; text-align: right; vertical-align: top; border-bottom: 1px solid #edf2f7;">Payment Confirmed</td>
              </tr>
              <tr>
                <td style="padding: 9px 0; color: #718096; width: 140px; font-weight: 600; vertical-align: top;">Venue:</td>
                <td style="padding: 9px 0; color: #1a202c; font-weight: 700; text-align: right; vertical-align: top;">Makerlab Experience Hub, 2nd Floor, Ayala Malls Manila Bay</td>
              </tr>
            </table>
          </div>

          <div class="info-card">
            <div class="info-card-title">Registrant Details</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 4px;">
              <tr>
                <td style="padding: 9px 0; color: #718096; width: 140px; font-weight: 600; vertical-align: top; border-bottom: 1px solid #edf2f7;">Name:</td>
                <td style="padding: 9px 0; color: #1a202c; font-weight: 700; text-align: right; vertical-align: top; border-bottom: 1px solid #edf2f7;">${customerName}</td>
              </tr>
              <tr>
                <td style="padding: 9px 0; color: #718096; width: 140px; font-weight: 600; vertical-align: top;">Email:</td>
                <td style="padding: 9px 0; color: #1a202c; font-weight: 700; text-align: right; vertical-align: top;">${to}</td>
              </tr>
            </table>
          </div>

          <div class="reminder-box">
            <p><strong>To schedule your workshop session:</strong> Visit our website, select a slot, and enter your voucher code during checkout.</p>
            <p><strong>Check-in Policy:</strong> Voucher units are deducted only when you physically check in for your session.</p>
          </div>

          <p style="font-size: 15px; color: #4a5568;">
            If you have any questions, please feel free to contact us. We look forward to seeing you at the workshop!
          </p>

          <div style="text-align: center; margin-top: 28px;">
            <a href="${hostUrl}/book-session" class="cta-button">Book a Session Now</a>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated confirmation email. Please do not reply directly to this message.</p>
          <p>&copy; ${new Date().getFullYear()} Makerlab Experience Hub. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Makerlab Experience Hub" <noreply@makerlab.ph>',
    to,
    subject: `Paid Workshop Voucher Confirmed — ${voucherCode}`,
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

interface SessionCancellationEmailParams {
  to: string
  customerName: string
  bookingReference: string
  moduleName: string
  sessionDate: string
  startTime: string
  endTime: string
  reason: string
  customNotes?: string
}

export async function sendSessionCancellationEmail({
  to,
  customerName,
  bookingReference,
  moduleName,
  sessionDate,
  startTime,
  endTime,
  reason,
  customNotes
}: SessionCancellationEmailParams) {
  let transporter: nodemailer.Transporter

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
      <title>Booking Update: Workshop Session Cancelled</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          background-color: #f7fafc;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .header {
          background-color: #ef4444;
          padding: 30px;
          text-align: center;
          color: #ffffff;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
        }
        .content {
          padding: 40px 30px;
          color: #2d3748;
          line-height: 1.6;
        }
        .content p {
          margin-top: 0;
          margin-bottom: 20px;
        }
        .info-card {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 25px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #edf2f7;
          padding-bottom: 8px;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .info-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
          margin-bottom: 0;
        }
        .info-label {
          color: #718096;
        }
        .info-value {
          color: #1a202c;
          font-weight: 600;
          text-align: right;
        }
        .cancellation-reason {
          background-color: #fff5f5;
          border: 1px dashed #feb2b2;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 25px;
          color: #c53030;
          font-size: 15px;
        }
        .cta-container {
          text-align: center;
          margin-top: 30px;
        }
        .cta-button {
          display: inline-block;
          background-color: #0f2540;
          color: #ffffff !important;
          text-decoration: none;
          padding: 12px 24px;
          font-weight: 700;
          border-radius: 6px;
          font-size: 16px;
        }
        .footer {
          background-color: #f7fafc;
          padding: 20px 30px;
          border-top: 1px solid #edf2f7;
          font-size: 12px;
          color: #a0aec0;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Workshop Session Cancelled</h1>
        </div>
        <div class="content">
          <p>Dear ${customerName},</p>
          <p>We regret to inform you that the workshop session you scheduled has been cancelled by Makerlab. Details of the cancelled booking are listed below:</p>
          
          <div class="info-card">
            <div class="info-row">
              <span class="info-label">Booking Reference:</span>
              <span class="info-value">${bookingReference}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Module:</span>
              <span class="info-value">${moduleName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Original Date:</span>
              <span class="info-value">${sessionDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Original Time:</span>
              <span class="info-value">${startTime} - ${endTime}</span>
            </div>
          </div>
          
          <div class="cancellation-reason">
            <strong>Reason for Cancellation:</strong><br/>
            ${reason}
            ${customNotes ? `<p style="margin-top: 8px; margin-bottom: 0; color: #4a5568; font-size: 14px; font-style: italic;">"${customNotes}"</p>` : ''}
          </div>
          
          <p>Your voucher credits have been fully restored. You can schedule another workshop session of your choice using your voucher at any time.</p>
          
          <div class="cta-container">
            <a href="${hostUrl}/book-session" class="cta-button">Reschedule Workshop</a>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated notification. If you have questions, please reply directly to this email or visit our reception desk.</p>
          <p>&copy; ${new Date().getFullYear()} Makerlab Workshop. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Makerlab Experience Hub" <noreply@makerlab.ph>',
    to,
    subject: `Booking Cancellation Notice: ${bookingReference}`,
    html: htmlContent,
  }

  const info = await transporter.sendMail(mailOptions)

  if (!useSmtp) {
    previewUrl = nodemailer.getTestMessageUrl(info) || ''
    console.log(`[Ethereal Email Sent] Cancellation Preview URL: ${previewUrl}`)
  }

  return {
    success: true,
    messageId: info.messageId,
    previewUrl,
  }
}

interface FreeBookingConfirmationEmailParams {
  to: string
  customerName: string
  customerEmail: string
  customerPhone: string
  bookingReference: string
  moduleName: string
  sessionDate: string
  startTime: string
  endTime: string
  paxCount: number
  qrCodeUrl: string
}

export async function sendFreeBookingConfirmationEmail({
  to,
  customerName,
  customerEmail,
  customerPhone,
  bookingReference,
  moduleName,
  sessionDate,
  startTime,
  endTime,
  paxCount,
  qrCodeUrl,
}: FreeBookingConfirmationEmailParams) {
  let transporter: nodemailer.Transporter

  const useSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  let previewUrl = ''

  if (useSmtp) {
    const host = process.env.SMTP_HOST?.replace(/^['"]|['"]$/g, '').trim()
    const portStr = process.env.SMTP_PORT?.toString().replace(/^['"]|['"]$/g, '').trim()
    const secureStr = process.env.SMTP_SECURE?.toString().replace(/^['"]|['"]$/g, '').trim()
    const user = process.env.SMTP_USER?.replace(/^['"]|['"]$/g, '').trim()
    const pass = process.env.SMTP_PASS?.replace(/^['"]|['"]$/g, '').replace(/\s+/g, '')

    transporter = nodemailer.createTransport({
      host,
      port: parseInt(portStr || '587', 10),
      secure: secureStr === 'true',
      auth: { user, pass },
    })
  } else {
    console.log('Generating Ethereal SMTP test account for free booking email...')
    const testAccount = await nodemailer.createTestAccount()
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    })
  }

  const hostUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const formattedDate = new Date(sessionDate).toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Free Workshop Reservation Confirmed</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f8; color: #1a202c; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; }
        .header { background: linear-gradient(135deg, #0f2540 0%, #1a3a5c 100%); color: #ffffff; padding: 36px 30px; text-align: center; }
        .header-badge { display: inline-block; background: rgba(255,255,255,0.15); border-radius: 20px; padding: 4px 14px; font-size: 12px; font-weight: 700; letter-spacing: 1px; margin-bottom: 12px; }
        .header h1 { margin: 0 0 6px; font-size: 26px; font-weight: 800; }
        .header p { margin: 0; opacity: 0.85; font-size: 14px; }
        .green-banner { background: linear-gradient(90deg, #16a34a, #22c55e); color: #fff; text-align: center; padding: 12px; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; }
        .content { padding: 36px 30px; line-height: 1.65; }
        .greeting { font-size: 20px; font-weight: 700; color: #0f2540; margin-bottom: 12px; }
        .intro-text { font-size: 15px; color: #4a5568; margin-bottom: 28px; }
        .info-card { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 22px; margin-bottom: 24px; }
        .info-card-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #718096; margin-bottom: 14px; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #edf2f7; font-size: 14px; }
        .info-row:last-child { border-bottom: none; padding-bottom: 0; }
        .info-label { color: #718096; }
        .info-value { color: #1a202c; font-weight: 600; text-align: right; max-width: 60%; }
        .ref-box { background: linear-gradient(135deg, #fff7ed, #ffedd5); border: 2px dashed #f97316; border-radius: 12px; padding: 18px 24px; text-align: center; margin-bottom: 24px; }
        .ref-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #ea580c; margin-bottom: 6px; }
        .ref-code { font-size: 22px; font-weight: 900; color: #c2410c; letter-spacing: 2px; font-family: monospace; }
        .qr-section { text-align: center; margin: 20px 0 28px; }
        .qr-section img { border: 4px solid #e2e8f0; border-radius: 12px; padding: 8px; background: #fff; }
        .qr-label { font-size: 12px; color: #718096; margin-top: 8px; }
        .reminder-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; }
        .reminder-box p { margin: 0 0 6px; font-size: 14px; color: #15803d; }
        .reminder-box p:last-child { margin-bottom: 0; }
        .cta-button { display: inline-block; background: #0f2540; color: #ffffff !important; text-decoration: none; padding: 14px 32px; font-weight: 700; border-radius: 8px; font-size: 15px; margin-top: 8px; }
        .footer { background: #f7fafc; padding: 20px 30px; border-top: 1px solid #edf2f7; font-size: 12px; color: #a0aec0; text-align: center; }
        .footer a { color: #f97316; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-badge">RESERVATION CONFIRMED</div>
          <h1>You're All Set!</h1>
          <p>Your Free Workshop slot has been reserved at Makerlab Experience Hub</p>
        </div>
        <div class="green-banner">FREE WORKSHOP — COMPLIMENTARY SESSION</div>
        <div class="content">
          <p class="greeting">Hello, ${customerName}!</p>
          <p class="intro-text">
            We're excited to welcome you to <strong>Makerlab Experience Hub</strong>! Your free workshop reservation has been confirmed. Please keep this email as your booking reference and present it at reception on the day of your session.
          </p>

          <div class="ref-box">
            <div class="ref-label">Booking Reference</div>
            <div class="ref-code">${bookingReference}</div>
          </div>

          <div class="info-card">
            <div class="info-card-title">Session Details</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 4px;">
              <tr>
                <td style="padding: 9px 0; color: #718096; width: 140px; font-weight: 600; vertical-align: top; border-bottom: 1px solid #edf2f7;">Workshop:</td>
                <td style="padding: 9px 0; color: #1a202c; font-weight: 700; text-align: right; vertical-align: top; border-bottom: 1px solid #edf2f7;">${moduleName}</td>
              </tr>
              <tr>
                <td style="padding: 9px 0; color: #718096; width: 140px; font-weight: 600; vertical-align: top; border-bottom: 1px solid #edf2f7;">Date:</td>
                <td style="padding: 9px 0; color: #1a202c; font-weight: 700; text-align: right; vertical-align: top; border-bottom: 1px solid #edf2f7;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 9px 0; color: #718096; width: 140px; font-weight: 600; vertical-align: top; border-bottom: 1px solid #edf2f7;">Time:</td>
                <td style="padding: 9px 0; color: #1a202c; font-weight: 700; text-align: right; vertical-align: top; border-bottom: 1px solid #edf2f7;">${startTime} - ${endTime}</td>
              </tr>
              <tr>
                <td style="padding: 9px 0; color: #718096; width: 140px; font-weight: 600; vertical-align: top; border-bottom: 1px solid #edf2f7;">Participants:</td>
                <td style="padding: 9px 0; color: #1a202c; font-weight: 700; text-align: right; vertical-align: top; border-bottom: 1px solid #edf2f7;">${paxCount} ${paxCount === 1 ? 'person' : 'people'}</td>
              </tr>
              <tr>
                <td style="padding: 9px 0; color: #718096; width: 140px; font-weight: 600; vertical-align: top;">Venue:</td>
                <td style="padding: 9px 0; color: #1a202c; font-weight: 700; text-align: right; vertical-align: top;">Makerlab Experience Hub, 2nd Floor, Ayala Malls Manila Bay</td>
              </tr>
            </table>
          </div>

          <div class="info-card">
            <div class="info-card-title">Registrant Details</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 4px;">
              <tr>
                <td style="padding: 9px 0; color: #718096; width: 140px; font-weight: 600; vertical-align: top; border-bottom: 1px solid #edf2f7;">Name:</td>
                <td style="padding: 9px 0; color: #1a202c; font-weight: 700; text-align: right; vertical-align: top; border-bottom: 1px solid #edf2f7;">${customerName}</td>
              </tr>
              <tr>
                <td style="padding: 9px 0; color: #718096; width: 140px; font-weight: 600; vertical-align: top; border-bottom: 1px solid #edf2f7;">Email:</td>
                <td style="padding: 9px 0; color: #1a202c; font-weight: 700; text-align: right; vertical-align: top; border-bottom: 1px solid #edf2f7;">${customerEmail}</td>
              </tr>
              <tr>
                <td style="padding: 9px 0; color: #718096; width: 140px; font-weight: 600; vertical-align: top;">Phone:</td>
                <td style="padding: 9px 0; color: #1a202c; font-weight: 700; text-align: right; vertical-align: top;">${customerPhone}</td>
              </tr>
            </table>
          </div>

          <div class="qr-section">
            <img src="${qrCodeUrl}" width="150" height="150" alt="Check-in QR Code" />
            <div class="qr-label">Show this QR code at reception for check-in</div>
          </div>

          <div class="reminder-box">
            <p><strong>Please arrive 10 minutes early</strong> to complete registration at the front desk.</p>
            <p><strong>Bring this email</strong> (printed or on your phone) along with a valid ID.</p>
            <p><strong>This session is completely FREE</strong> — no payment required!</p>
          </div>

          <p style="font-size: 15px; color: #4a5568;">
            If you need to make changes to your reservation or have any questions, please don't hesitate to reach out to us. We look forward to seeing you!
          </p>

          <div style="text-align: center; margin-top: 28px;">
            <a href="${hostUrl}/book-session" class="cta-button">Manage My Booking</a>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated confirmation email. Please do not reply directly to this message.</p>
          <p>&copy; ${new Date().getFullYear()} Makerlab Experience Hub. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Makerlab Experience Hub" <noreply@makerlab.ph>',
    to,
    subject: `Free Workshop Confirmed — ${bookingReference} | ${formattedDate}`,
    html: htmlContent,
  }

  const info = await transporter.sendMail(mailOptions)

  if (!useSmtp) {
    previewUrl = nodemailer.getTestMessageUrl(info) || ''
    console.log(`[Ethereal Email Sent] Free Booking Confirmation Preview URL: ${previewUrl}`)
  }

  return { success: true, messageId: info.messageId, previewUrl }
}

interface PaidBookingConfirmationEmailParams {
  to: string
  customerName: string
  customerEmail: string
  customerPhone: string
  bookingReference: string
  moduleName: string
  sessionDate: string
  startTime: string
  endTime: string
  paxCount: number
  qrCodeUrl?: string
  amountPaid?: string
}

export async function sendPaidBookingConfirmationEmail({
  to,
  customerName,
  customerEmail,
  customerPhone,
  bookingReference,
  moduleName,
  sessionDate,
  startTime,
  endTime,
  paxCount,
  qrCodeUrl,
  amountPaid,
}: PaidBookingConfirmationEmailParams) {
  let transporter: nodemailer.Transporter

  const useSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  let previewUrl = ''

  if (useSmtp) {
    const host = process.env.SMTP_HOST?.replace(/^['"]|['"]$/g, '').trim()
    const portStr = process.env.SMTP_PORT?.toString().replace(/^['"]|['"]$/g, '').trim()
    const secureStr = process.env.SMTP_SECURE?.toString().replace(/^['"]|['"]$/g, '').trim()
    const user = process.env.SMTP_USER?.replace(/^['"]|['"]$/g, '').trim()
    const pass = process.env.SMTP_PASS?.replace(/^['"]|['"]$/g, '').replace(/\s+/g, '')

    transporter = nodemailer.createTransport({
      host,
      port: parseInt(portStr || '587', 10),
      secure: secureStr === 'true',
      auth: { user, pass },
    })
  } else {
    console.log('Generating Ethereal SMTP test account for paid booking email...')
    const testAccount = await nodemailer.createTestAccount()
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    })
  }

  const hostUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const formattedDate = new Date(sessionDate).toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Paid Workshop Reservation Confirmed</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f8; color: #1a202c; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; }
        .header { background: linear-gradient(135deg, #0f2540 0%, #1a3a5c 100%); color: #ffffff; padding: 36px 30px; text-align: center; }
        .header-badge { display: inline-block; background: rgba(255,255,255,0.15); border-radius: 20px; padding: 4px 14px; font-size: 12px; font-weight: 700; letter-spacing: 1px; margin-bottom: 12px; }
        .header h1 { margin: 0 0 6px; font-size: 26px; font-weight: 800; }
        .header p { margin: 0; opacity: 0.85; font-size: 14px; }
        .green-banner { background: linear-gradient(90deg, #16a34a, #22c55e); color: #fff; text-align: center; padding: 12px; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; }
        .content { padding: 36px 30px; line-height: 1.65; }
        .greeting { font-size: 20px; font-weight: 700; color: #0f2540; margin-bottom: 12px; }
        .intro-text { font-size: 15px; color: #4a5568; margin-bottom: 28px; }
        .info-card { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 22px; margin-bottom: 24px; }
        .info-card-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #718096; margin-bottom: 14px; }
        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #edf2f7; font-size: 14px; }
        .info-row:last-child { border-bottom: none; padding-bottom: 0; }
        .info-label { color: #718096; }
        .info-value { color: #1a202c; font-weight: 600; text-align: right; max-width: 60%; }
        .ref-box { background: linear-gradient(135deg, #fff7ed, #ffedd5); border: 2px dashed #f97316; border-radius: 12px; padding: 18px 24px; text-align: center; margin-bottom: 24px; }
        .ref-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #ea580c; margin-bottom: 6px; }
        .ref-code { font-size: 22px; font-weight: 900; color: #c2410c; letter-spacing: 2px; font-family: monospace; }
        .qr-section { text-align: center; margin: 20px 0 28px; }
        .qr-section img { border: 4px solid #e2e8f0; border-radius: 12px; padding: 8px; background: #fff; }
        .qr-label { font-size: 12px; color: #718096; margin-top: 8px; }
        .reminder-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; }
        .reminder-box p { margin: 0 0 6px; font-size: 14px; color: #15803d; }
        .reminder-box p:last-child { margin-bottom: 0; }
        .cta-button { display: inline-block; background: #0f2540; color: #ffffff !important; text-decoration: none; padding: 14px 32px; font-weight: 700; border-radius: 8px; font-size: 15px; margin-top: 8px; }
        .footer { background: #f7fafc; padding: 20px 30px; border-top: 1px solid #edf2f7; font-size: 12px; color: #a0aec0; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-badge">PAYMENT CONFIRMED</div>
          <h1>You're All Set!</h1>
          <p>Your Paid Workshop reservation has been confirmed at Makerlab Experience Hub</p>
        </div>
        <div class="green-banner">PAID WORKSHOP — SESSION CONFIRMED</div>
        <div class="content">
          <p class="greeting">Hello, ${customerName}!</p>
          <p class="intro-text">
            We are excited to welcome you to <strong>Makerlab Experience Hub</strong>! Your payment for the workshop has been successfully confirmed. Please keep this email as your booking reference and present it at reception on the day of your session.
          </p>

          <div class="ref-box">
            <div class="ref-label">Booking Reference</div>
            <div class="ref-code">${bookingReference}</div>
          </div>

          <div class="info-card">
            <div class="info-card-title">Session Details</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 4px;">
              <tr>
                <td style="padding: 9px 0; color: #718096; width: 140px; font-weight: 600; vertical-align: top; border-bottom: 1px solid #edf2f7;">Workshop:</td>
                <td style="padding: 9px 0; color: #1a202c; font-weight: 700; text-align: right; vertical-align: top; border-bottom: 1px solid #edf2f7;">${moduleName}</td>
              </tr>
              <tr>
                <td style="padding: 9px 0; color: #718096; width: 140px; font-weight: 600; vertical-align: top; border-bottom: 1px solid #edf2f7;">Date:</td>
                <td style="padding: 9px 0; color: #1a202c; font-weight: 700; text-align: right; vertical-align: top; border-bottom: 1px solid #edf2f7;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 9px 0; color: #718096; width: 140px; font-weight: 600; vertical-align: top; border-bottom: 1px solid #edf2f7;">Time:</td>
                <td style="padding: 9px 0; color: #1a202c; font-weight: 700; text-align: right; vertical-align: top; border-bottom: 1px solid #edf2f7;">${startTime} - ${endTime}</td>
              </tr>
              <tr>
                <td style="padding: 9px 0; color: #718096; width: 140px; font-weight: 600; vertical-align: top; border-bottom: 1px solid #edf2f7;">Participants:</td>
                <td style="padding: 9px 0; color: #1a202c; font-weight: 700; text-align: right; vertical-align: top; border-bottom: 1px solid #edf2f7;">${paxCount} ${paxCount === 1 ? 'person' : 'people'}</td>
              </tr>
              <tr>
                <td style="padding: 9px 0; color: #718096; width: 140px; font-weight: 600; vertical-align: top; border-bottom: 1px solid #edf2f7;">Payment Status:</td>
                <td style="padding: 9px 0; color: #16a34a; font-weight: 700; text-align: right; vertical-align: top; border-bottom: 1px solid #edf2f7;">Payment Confirmed</td>
              </tr>
              ${amountPaid ? `
              <tr>
                <td style="padding: 9px 0; color: #718096; width: 140px; font-weight: 600; vertical-align: top; border-bottom: 1px solid #edf2f7;">Amount Paid:</td>
                <td style="padding: 9px 0; color: #1a202c; font-weight: 700; text-align: right; vertical-align: top; border-bottom: 1px solid #edf2f7;">${amountPaid}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 9px 0; color: #718096; width: 140px; font-weight: 600; vertical-align: top;">Venue:</td>
                <td style="padding: 9px 0; color: #1a202c; font-weight: 700; text-align: right; vertical-align: top;">Makerlab Experience Hub, 2nd Floor, Ayala Malls Manila Bay</td>
              </tr>
            </table>
          </div>

          <div class="info-card">
            <div class="info-card-title">Registrant Details</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 4px;">
              <tr>
                <td style="padding: 9px 0; color: #718096; width: 140px; font-weight: 600; vertical-align: top; border-bottom: 1px solid #edf2f7;">Name:</td>
                <td style="padding: 9px 0; color: #1a202c; font-weight: 700; text-align: right; vertical-align: top; border-bottom: 1px solid #edf2f7;">${customerName}</td>
              </tr>
              <tr>
                <td style="padding: 9px 0; color: #718096; width: 140px; font-weight: 600; vertical-align: top; border-bottom: 1px solid #edf2f7;">Email:</td>
                <td style="padding: 9px 0; color: #1a202c; font-weight: 700; text-align: right; vertical-align: top; border-bottom: 1px solid #edf2f7;">${customerEmail}</td>
              </tr>
              <tr>
                <td style="padding: 9px 0; color: #718096; width: 140px; font-weight: 600; vertical-align: top;">Phone:</td>
                <td style="padding: 9px 0; color: #1a202c; font-weight: 700; text-align: right; vertical-align: top;">${customerPhone}</td>
              </tr>
            </table>
          </div>

          ${qrCodeUrl ? `
          <div class="qr-section">
            <img src="${qrCodeUrl}" width="150" height="150" alt="Check-in QR Code" />
            <div class="qr-label">Show this QR code at reception for check-in</div>
          </div>
          ` : ''}

          <div class="reminder-box">
            <p><strong>Please arrive 10 minutes early</strong> before your scheduled workshop to ensure a smooth check-in experience.</p>
            <p><strong>Present this confirmation email</strong> (printed or on your phone) together with your valid ID for verification.</p>
            <p><strong>Payment Status:</strong> Payment verified in full.</p>
          </div>

          <p style="font-size: 15px; color: #4a5568;">
            If you need to make changes to your reservation or have any questions, please don't hesitate to reach out to us. We look forward to seeing you!
          </p>

          <div style="text-align: center; margin-top: 28px;">
            <a href="${hostUrl}/book-session" class="cta-button">Manage My Booking</a>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated confirmation email. Please do not reply directly to this message.</p>
          <p>&copy; ${new Date().getFullYear()} Makerlab Experience Hub. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Makerlab Experience Hub" <noreply@makerlab.ph>',
    to,
    subject: `Paid Workshop Confirmed — ${bookingReference} | ${formattedDate}`,
    html: htmlContent,
  }

  const info = await transporter.sendMail(mailOptions)

  if (!useSmtp) {
    previewUrl = nodemailer.getTestMessageUrl(info) || ''
    console.log(`[Ethereal Email Sent] Paid Booking Confirmation Preview URL: ${previewUrl}`)
  }

  return { success: true, messageId: info.messageId, previewUrl }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shopify Payment Confirmation — sends booking reference to customer
// ─────────────────────────────────────────────────────────────────────────────
interface BookingConfirmationParams {
  to: string
  customerName: string
  bookingReference: string
  sessionDate?: string
  sessionTime?: string
  amount?: string
}

export async function sendBookingConfirmationEmail({
  to,
  customerName,
  bookingReference,
  sessionDate,
  sessionTime,
  amount,
}: BookingConfirmationParams) {
  let transporter: nodemailer.Transporter
  const useSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  let previewUrl = ''

  if (useSmtp) {
    const host = process.env.SMTP_HOST?.replace(/^["|']|["|']$/g, '').trim()
    const portStr = process.env.SMTP_PORT?.toString().replace(/^["|']|["|']$/g, '').trim()
    const secureStr = process.env.SMTP_SECURE?.toString().replace(/^["|']|["|']$/g, '').trim()
    const user = process.env.SMTP_USER?.replace(/^["|']|["|']$/g, '').trim()
    const pass = process.env.SMTP_PASS?.replace(/^["|']|["|']$/g, '').replace(/\s+/g, '')
    transporter = nodemailer.createTransport({
      host,
      port: parseInt(portStr || '587', 10),
      secure: secureStr === 'true',
      auth: { user, pass },
    })
  } else {
    const testAccount = await nodemailer.createTestAccount()
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    })
  }

  const firstName = customerName.split(' ')[0] || customerName
  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/book-session`

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Print 2 Profit Booking Confirmation</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f0f4f8; color: #1a202c; }
        .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #0f2540 0%, #1a3a5c 100%); padding: 40px 32px; text-align: center; }
        .header-logo { font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; }
        .header-logo span { color: #f6ad55; }
        .header-tagline { color: #90cdf4; font-size: 13px; margin-top: 6px; letter-spacing: 1px; text-transform: uppercase; }
        .content { padding: 40px 32px; }
        .greeting { font-size: 22px; font-weight: 700; color: #0f2540; margin-bottom: 12px; }
        .intro { font-size: 15px; color: #4a5568; line-height: 1.7; margin-bottom: 32px; }
        .reference-card { background: linear-gradient(135deg, #0f2540 0%, #1e4a7a 100%); border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 32px; }
        .reference-label { color: #90cdf4; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; }
        .reference-code { font-size: 30px; font-weight: 900; color: #ffffff; letter-spacing: 3px; font-family: 'Courier New', monospace; background: rgba(255,255,255,0.1); border-radius: 8px; padding: 16px 24px; display: inline-block; border: 2px dashed rgba(255,255,255,0.3); }
        .reference-note { color: #bee3f8; font-size: 12px; margin-top: 14px; line-height: 1.5; }
        .details-card { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; margin-bottom: 32px; }
        .details-title { font-size: 13px; font-weight: 700; color: #718096; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
        .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #edf2f7; font-size: 14px; }
        .detail-row:last-child { border-bottom: none; padding-bottom: 0; }
        .detail-label { color: #718096; }
        .detail-value { color: #1a202c; font-weight: 600; text-align: right; }
        .steps-section { margin-bottom: 32px; }
        .steps-title { font-size: 15px; font-weight: 700; color: #0f2540; margin-bottom: 16px; }
        .step { display: flex; gap: 14px; margin-bottom: 14px; align-items: flex-start; }
        .step-num { width: 28px; height: 28px; border-radius: 50%; background: #0f2540; color: #fff; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .step-text { font-size: 14px; color: #4a5568; line-height: 1.6; padding-top: 4px; }
        .step-text strong { color: #1a202c; }
        .cta-container { text-align: center; margin-bottom: 32px; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #f6ad55, #ed8936); color: #0f2540 !important; text-decoration: none; padding: 14px 36px; font-weight: 800; border-radius: 8px; font-size: 15px; letter-spacing: 0.3px; }
        .divider { border: none; border-top: 1px solid #e2e8f0; margin: 0 32px; }
        .footer { padding: 24px 32px; text-align: center; font-size: 12px; color: #a0aec0; line-height: 1.7; }
        .footer a { color: #667eea; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <div class="header-logo">Maker<span>Lab</span></div>
          <div class="header-tagline">3D Printing Workshop</div>
        </div>
        <div class="content">
          <div class="greeting">Payment Confirmed, ${firstName}!</div>
          <p class="intro">
            Thank you for registering for the <strong>Print 2 Profit Workshop</strong>.
            Your payment has been successfully received. Below is your personal <strong>Booking Reference Code</strong> — 
            keep this safe! You'll need it to reserve your seat in our workshop scheduling system.
          </p>

          <div class="reference-card">
            <div class="reference-label">Your Booking Reference Code</div>
            <div class="reference-code">${bookingReference}</div>
            <div class="reference-note">
              Present this code when reserving your session slot.<br>
              This code is unique to your registration.
            </div>
          </div>

          <div class="details-card">
            <div class="details-title">Order Summary</div>
            <div class="detail-row">
              <span class="detail-label">Workshop</span>
              <span class="detail-value">Print 2 Profit</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">SKU</span>
              <span class="detail-value">BW001</span>
            </div>
            ${sessionDate ? `
            <div class="detail-row">
              <span class="detail-label">Session Date</span>
              <span class="detail-value">${sessionDate}</span>
            </div>` : ''}
            ${sessionTime ? `
            <div class="detail-row">
              <span class="detail-label">Time Slot</span>
              <span class="detail-value">${sessionTime}</span>
            </div>` : ''}
            ${amount ? `
            <div class="detail-row">
              <span class="detail-label">Amount Paid</span>
              <span class="detail-value">${amount}</span>
            </div>` : ''}
            <div class="detail-row">
              <span class="detail-label">Status</span>
              <span class="detail-value" style="color: #38a169;">✓ Payment Confirmed</span>
            </div>
          </div>

          <div class="steps-section">
            <div class="steps-title">What happens next?</div>
            <div class="step">
              <div class="step-num">1</div>
              <div class="step-text">Visit our <strong>Booking System</strong> using the button below.</div>
            </div>
            <div class="step">
              <div class="step-num">2</div>
              <div class="step-text">Enter your <strong>Booking Reference Code</strong> (${bookingReference}) when prompted.</div>
            </div>
            <div class="step">
              <div class="step-num">3</div>
              <div class="step-text">Choose your <strong>preferred session slot</strong> and confirm your reservation.</div>
            </div>
            <div class="step">
              <div class="step-num">4</div>
              <div class="step-text">You're all set! We'll send a confirmation with your session details.</div>
            </div>
          </div>

          <div class="cta-container">
            <a href="${bookingUrl}" class="cta-button">Reserve My Session Now →</a>
          </div>
        </div>
        <hr class="divider">
        <div class="footer">
          <p>Questions? Contact us at <a href="mailto:makerlab@makerlab.ph">makerlab@makerlab.ph</a></p>
          <p style="margin-top: 8px;">© ${new Date().getFullYear()} MakerLab 3D Workshop. All rights reserved.</p>
          <p style="margin-top: 8px; color: #cbd5e0;">This email was sent to ${to} because you purchased a Print 2 Profit workshop.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const fromAddress = process.env.SMTP_FROM?.replace(/^["|']|["|']$/g, '').trim()
    || '"MakerLab 3D Workshop" <makerlab@makerlab.ph>'

  const info = await transporter.sendMail({
    from: fromAddress,
    to,
    subject: `Your Booking Reference: ${bookingReference} — Print 2 Profit Workshop`,
    html: htmlContent,
    text: `Hi ${firstName},\n\nThank you for registering for Print 2 Profit!\n\nYour Booking Reference Code is: ${bookingReference}\n\nUse this code to reserve your session slot at: ${bookingUrl}\n\nSee you at the workshop!\nMakerLab Team`,
  })

  if (!useSmtp) {
    previewUrl = nodemailer.getTestMessageUrl(info) || ''
    console.log(`[Ethereal Email Sent] Booking Confirmation Preview URL: ${previewUrl}`)
  }

  return { success: true, messageId: info.messageId, previewUrl }
}

