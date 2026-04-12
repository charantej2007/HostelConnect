const path = require('path');

class MailService {
  constructor() {
    this.apiKey = process.env.RESEND_API_KEY;
    this.fromEmail = 'onboarding@resend.dev'; // Resend's default for unverified domains
    
    if (!this.apiKey) {
      console.warn('WARNING: RESEND_API_KEY is missing. Emails will fail to send.');
    } else {
      console.log('MailService initialized with Resend Web API');
    }
  }

  async sendOTP(email, otp, purpose) {
    if (!this.apiKey) {
      throw new Error('Mail Service is not configured (RESEND_API_KEY missing)');
    }

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
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          from: `HostelConnect <${this.fromEmail}>`,
          to: [email],
          subject: subject,
          text: text,
          html: html
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Resend API Error:', data);
        throw new Error(`Mail API Failure: ${data.message || response.statusText}`);
      }

      console.log('Email sent successfully via Resend:', data.id);
      return true;
    } catch (error) {
      console.error('Mail Service Error DETAILS:', error);
      throw new Error(`Failed to send email via API: ${error.message}`);
    }
  }
}

module.exports = new MailService();
