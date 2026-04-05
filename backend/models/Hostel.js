const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  id: { type: String, required: true },
  blockName: { type: String, required: true },
  wardenName: String,
  mobile: String,
  whatsappLink: String,
  facilities: [String]
});

const hostelSchema = new mongoose.Schema({
  institution_name: { type: String, required: true },
  admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The admin user who created this hostel
  student_code: { type: String, required: true, unique: true },
  worker_code: { type: String, required: true, unique: true },
  admin_name: String,
  admin_phone: String,
  admin_email: String,
  blocks: [blockSchema],
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Hostel', hostelSchema);
