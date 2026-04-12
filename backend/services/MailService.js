const nodemailer = require('nodemailer');

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.MAIL_SERVICE,
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: process.env.MAIL_PORT == 465,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 15000
    });

    // Verify connection on startup
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('SMTP Connection Error:', error);
      } else {
        console.log('SMTP Server is ready to take messages');
      }
    });
  }

  async sendOTP(email, otp, purpose) {
    const subject = purpose === 'signup' ? 'HostelConnect - Signup OTP' : 'HostelConnect - Forgot Password OTP';
    const text = `Your OTP for ${purpose === 'signup' ? 'Signup' : 'Resetting Password'} is: ${otp}. This OTP is valid for 5 minutes.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ccc; border-radius: 10px;">
        <h2 style="color: #1E88E5; text-align: center;">HostelConnect Verification</h2>
        <p>Hello,</p>
        <p>You requested an OTP for <strong>${purpose === 'signup' ? 'Signup' : 'Resetting your password'}</strong> on HostelConnect.</p>
        <div style="background-color: #f5f7fa; padding: 15px; text-align: center; border-radius: 8px;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1E88E5;">${otp}</span>
        </div>
        <p style="margin-top: 20px;">This OTP is valid for <strong>5 minutes</strong>. If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777; text-align: center;">&copy; 2026 HostelConnect. All rights reserved.</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"HostelConnect" <${process.env.MAIL_USER}>`,
        to: email,
        subject,
        text,
        html
      });
      return true;
    } catch (error) {
      console.error('Mail sending error:', error);
      throw new Error('Failed to send email. Please check your SMTP configuration.');
    }
  }
}

module.exports = new MailService();
