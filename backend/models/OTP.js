const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  purpose: { type: String, enum: ['signup', 'forgot-password'], required: true },
  created_at: { type: Date, default: Date.now, expires: 300 } // Expires in 5 minutes (300 seconds)
});

module.exports = mongoose.model('OTP', otpSchema);
