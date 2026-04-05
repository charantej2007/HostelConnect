const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  worker_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  hostel_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel', required: true },
  complaint_type: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  created_time: { type: Date, default: Date.now },
  sla_deadline: { type: Date, required: true },
  completed_time: Date,
  attachments: [String] // URLs for uploaded images
});

module.exports = mongoose.model('Complaint', complaintSchema);
