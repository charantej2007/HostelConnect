// ComplaintService.js - Business Logic for SLA-based Complaint Management (MongoDB)
const Complaint = require('../models/Complaint');

const SLA_CONFIG = {
    'ELECTRICAL': 12, // 12 hours
    'WATER': 4,      // 4 hours
    'CLEANING': 24,   // 24 hours
    'FURNITURE': 48,  // 48 hours
    'OTHER': 24       // 24 hours
};

class ComplaintService {
    // 1. Raise Complaint
    static async raiseComplaint({ student_id, hostel_id, type, description }) {
        const created_time = new Date();
        const sla_hours = SLA_CONFIG[type?.toUpperCase()] || 24;
        const sla_deadline = new Date(created_time.getTime() + sla_hours * 60 * 60 * 1000);

        const complaint = new Complaint({
            student_id,
            hostel_id,
            complaint_type: type,
            description,
            status: 'Pending',
            created_time,
            sla_deadline
        });

        await complaint.save();
        return complaint;
    }

    // 2. Fetch Complaints by Hostel (Multi-tenant isolation)
    static async getHostelComplaints(hostel_id, filters = {}) {
        const query = { hostel_id };
        if (filters.student_id) query.student_id = filters.student_id;
        if (filters.status) query.status = filters.status;
        
        return await Complaint.find(query)
            .populate({ path: 'student_id', select: 'name phone_number room_id', populate: { path: 'room_id', select: 'room_number block' } })
            .populate('worker_id', 'name')
            .sort({ status: -1, sla_deadline: 1, created_time: -1 });
    }

    // 3. Admin Assign Worker
    static async assignWorker(complaint_id, worker_id) {
        const complaint = await Complaint.findByIdAndUpdate(
            complaint_id,
            { 
                worker_id, 
                status: 'In Progress' 
            },
            { new: true }
        );
        return complaint;
    }

    // 4. Worker Mark Completed
    static async markCompleted(complaint_id) {
        const complaint = await Complaint.findByIdAndUpdate(
            complaint_id,
            { 
                status: 'Completed', 
                completed_time: new Date() 
            },
            { new: true }
        );
        return complaint;
    }

    // 5. SLA Status Calculation (Internal helper)
    static getSLAStatus(complaint) {
        const now = new Date();
        const deadline = new Date(complaint.sla_deadline);
        const isBreached = complaint.status !== 'Completed' && now > deadline;
        
        return {
            isBreached,
            timeLeft: isBreached ? 0 : Math.max(0, deadline - now)
        };
    }
}

module.exports = ComplaintService;
