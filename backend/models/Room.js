const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  hostel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
  block: { type: String, required: true },
  floor: { type: String, required: true },
  room_number: { type: String, required: true },
  room_type: { type: String, enum: ['2 Sharing', '4 Sharing', '5 Sharing'], required: true },
  max_occupancy: { type: Number, required: true },
  current_occupants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  amenities: [{ type: String }],
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', roomSchema);
