const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['student', 'worker', 'admin'], required: true },
  hostel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel' },
  room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  registration_number: { type: String },
  phone_number: String,
  password_hash: String,
  firebase_uid: { type: String, unique: true, sparse: true },
  profile_pic: String,
  created_at: { type: Date, default: Date.now }
});

// Never send password_hash to the frontend
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password_hash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
