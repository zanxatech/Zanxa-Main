const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendOTPEmail = async (to, otp, purpose = 'verification') => {
  const subjects = {
    register: 'Zanxa Tech — Verify Your Email',
    forgot_password: 'Zanxa Tech — Password Reset OTP',
    forgot_password_link: 'Zanxa Tech — Secure Password Reset',
    employee_register: 'Zanxa Tech — Employee Verification',
  };

  const titles = {
    register: 'Verify Your Email Address',
    forgot_password: 'Reset Your Password',
    forgot_password_link: 'Secure Password Reset',
    employee_register: 'Verify Your Employee Account',
  };

  const isLink = purpose === 'forgot_password_link';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#f8f5f0;font-family:'Segoe UI',Arial,sans-serif;">
      <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(75,46,46,0.1);">
        <div style="background:linear-gradient(135deg,#4b2e2e 0%,#7a4a2e 100%);padding:40px 32px;text-align:center;">
          <h1 style="color:#d4af37;font-size:32px;margin:0;letter-spacing:2px;font-weight:700;">ZANXA TECH</h1>
          <p style="color:#f1e9dc;margin:8px 0 0;font-size:14px;opacity:0.85;">Premium Tech Solutions</p>
        </div>
        <div style="padding:40px 32px;">
          <h2 style="color:#4b2e2e;font-size:22px;margin:0 0 16px;">${titles[purpose] || 'Verification Code'}</h2>
          <p style="color:#7a5c5c;font-size:15px;line-height:1.6;margin:0 0 32px;">
            ${isLink 
              ? 'We received a request to reset your password. Click the button below to establish a new credential. This link expires in 15 minutes.' 
              : 'Use the OTP below to complete your request. This code is valid for 10 minutes.'}
          </p>
          <div style="text-align:center;margin:0 0 32px;">
            ${isLink 
              ? `<a href="${otp}" style="display:inline-block;padding:18px 48px;background:#d4af37;color:#fff;text-decoration:none;border-radius:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;box-shadow:0 8px 16px rgba(212,175,55,0.2);">Reset Password Now</a>`
              : `<div style="background:#f8f5f0;border:2px solid #d4af37;border-radius:12px;padding:24px;"><span style="font-size:42px;font-weight:800;color:#4b2e2e;letter-spacing:12px;">${otp}</span></div>`}
          </div>
          <p style="color:#9e7e7e;font-size:13px;margin:0;">
            If you didn't request this, please ignore this email. Do not share this ${isLink ? 'link' : 'OTP'} with anyone.
          </p>
        </div>
        <div style="background:#f1e9dc;padding:20px 32px;text-align:center;border-top:1px solid #e8d9c0;">
          <p style="color:#7a5c5c;font-size:12px;margin:0;">© 2024 Zanxa Tech. All rights reserved.</p>
          <p style="color:#9e7e7e;font-size:11px;margin:4px 0 0;">zanxatech@gmail.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Zanxa Tech <zanxatech@gmail.com>',
    to,
    subject: subjects[purpose] || 'Zanxa Tech — OTP Verification',
    html,
  });
};

const sendOrderConfirmationEmail = async (orderDetails) => {
  const { customerName, customerPhone, serviceType, templateId, description, paymentId, amount, createdAt } = orderDetails;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f8f5f0;font-family:'Segoe UI',Arial,sans-serif;">
      <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(75,46,46,0.1);">
        <div style="background:linear-gradient(135deg,#4b2e2e 0%,#7a4a2e 100%);padding:40px 32px;text-align:center;">
          <h1 style="color:#d4af37;font-size:32px;margin:0;letter-spacing:2px;">ZANXA TECH</h1>
          <p style="color:#f1e9dc;margin:8px 0 0;font-size:14px;">New Order Received!</p>
        </div>
        <div style="padding:40px 32px;">
          <h2 style="color:#4b2e2e;">Order Details</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#7a5c5c;font-weight:600;">Customer Name:</td><td style="padding:8px 0;color:#4b2e2e;">${customerName}</td></tr>
            <tr><td style="padding:8px 0;color:#7a5c5c;font-weight:600;">Phone:</td><td style="padding:8px 0;color:#4b2e2e;">${customerPhone}</td></tr>
            <tr><td style="padding:8px 0;color:#7a5c5c;font-weight:600;">Service:</td><td style="padding:8px 0;color:#4b2e2e;">${serviceType}</td></tr>
            ${templateId ? `<tr><td style="padding:8px 0;color:#7a5c5c;font-weight:600;">Template ID:</td><td style="padding:8px 0;color:#4b2e2e;">${templateId}</td></tr>` : ''}
            <tr><td style="padding:8px 0;color:#7a5c5c;font-weight:600;">Description:</td><td style="padding:8px 0;color:#4b2e2e;">${description || 'N/A'}</td></tr>
            <tr><td style="padding:8px 0;color:#7a5c5c;font-weight:600;">Payment ID:</td><td style="padding:8px 0;color:#4b2e2e;">${paymentId}</td></tr>
            <tr><td style="padding:8px 0;color:#7a5c5c;font-weight:600;">Amount Paid:</td><td style="padding:8px 0;color:#d4af37;font-weight:700;">₹${amount}</td></tr>
            <tr><td style="padding:8px 0;color:#7a5c5c;font-weight:600;">Date & Time:</td><td style="padding:8px 0;color:#4b2e2e;">${new Date(createdAt).toLocaleString('en-IN')}</td></tr>
          </table>
        </div>
        <div style="background:#f1e9dc;padding:20px 32px;text-align:center;">
          <p style="color:#7a5c5c;font-size:12px;margin:0;">© 2024 Zanxa Tech. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Zanxa Tech <zanxatech@gmail.com>',
    to: 'zanxatech@gmail.com',
    subject: `New Order — ${serviceType} | ₹${amount}`,
    html,
  });
};

module.exports = { sendOTPEmail, sendOrderConfirmationEmail };
