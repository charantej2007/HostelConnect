const OTP = require('../models/OTP');
const MailService = require('./MailService');
const crypto = require('crypto');

class OTPService {
  async generateOTP(email, purpose) {
    // 1. Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Save the OTP to MongoDB with TTL
    await OTP.findOneAndUpdate(
      { email, purpose },
      { otp, created_at: Date.now() },
      { upsert: true, new: true }
    );

    // 3. Send the OTP via email
    await MailService.sendOTP(email, otp, purpose);

    return otp;
  }

  async verifyOTP(email, otp, purpose) {
    const record = await OTP.findOne({ email, otp, purpose });
    if (!record) {
      throw new Error('Invalid or expired OTP');
    }

    // OTP verified successfully, so delete it
    await OTP.deleteOne({ _id: record._id });
    return true;
  }
}

module.exports = new OTPService();
