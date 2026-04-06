const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hostel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  attachments: [String], // Array of URLs (documents/images)
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  pinned: { type: Boolean, default: false },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Announcement', announcementSchema);
