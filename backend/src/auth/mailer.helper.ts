import * as nodemailer from 'nodemailer';

export async function sendResetCodeEmail(email: string, name: string, code: string) {
  const mailSubject = 'Reset Your EN2H Booking Board Password';
  
  // Professional HTML Template
  const mailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background-color: #030712;
          color: #f3f4f6;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
        }
        .header {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          color: #ffffff;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.025em;
        }
        .content {
          padding: 40px 30px;
          line-height: 1.6;
        }
        .content p {
          margin: 0 0 20px 0;
          font-size: 15px;
          color: #94a3b8;
        }
        .code-box {
          background-color: #020617;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          margin: 30px 0;
        }
        .code-title {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #6366f1;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .code-number {
          font-size: 36px;
          font-weight: 800;
          letter-spacing: 0.25em;
          color: #ffffff;
          margin: 0;
        }
        .footer {
          background-color: #0b0f19;
          padding: 20px 30px;
          border-top: 1px solid #1e293b;
          text-align: center;
          font-size: 12px;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>EN2H Booking Board</h1>
        </div>
        <div class="content">
          <p>Hi ${name || 'there'},</p>
          <p>We received a request to reset the password for your Client Account. Use the verification code below to authorize this request. This code is valid for 15 minutes.</p>
          <div class="code-box">
            <div class="code-title">Verification Code</div>
            <div class="code-number">${code}</div>
          </div>
          <p>If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} EN2H Booking Board. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || 'no-reply@entwoh.com';

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || '587'),
        secure: smtpPort === '465',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `EN2H Booking Board <${smtpFrom}>`,
        to: email,
        subject: mailSubject,
        html: mailHtml,
      });

      console.log(`[Mailer] Verification email sent successfully to ${email}`);
      return;
    } catch (error) {
      console.error(`[Mailer Error] Failed to send email via SMTP:`, error);
    }
  }

  // Fallback: print to console log with premium framing
  console.log(`
┌────────────────────────────────────────────────────────┐
│               SMTP EMAIL FALLBACK LOG                  │
├────────────────────────────────────────────────────────┤
│ TO:      ${email}
│ SUBJECT: ${mailSubject}
│ CODE:    [ ${code} ]
├────────────────────────────────────────────────────────┤
│ HTML Preview:
${mailHtml}
└────────────────────────────────────────────────────────┘
  `);
}
