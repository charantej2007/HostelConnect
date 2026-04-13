const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['student', 'worker', 'admin'], required: true },
  hostel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel' },
  room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  registration_number: { type: String },
  phone_number: String,
  password_hash: String, // Added for database user validation
  firebase_uid: { type: String, unique: true }, // For Google Auth association
  profile_pic: String,
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
