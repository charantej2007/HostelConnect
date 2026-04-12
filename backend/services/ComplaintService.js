// ComplaintService.js - Business Logic for SLA-based Complaint Management (MongoDB)
const Complaint = require('../models/Complaint');

const SLA_CONFIG = {
    'ELECTRICAL': 12, // 12 hours
    'WATER': 4,      // 4 hours
    'CLEANING': 24,   // 24 hours
    'FURNITURE': 48,  // 48 hours
    'OTHER': 24       // 24 hours
};

const mongoose = require('mongoose');

class ComplaintService {
    // 1. Raise Complaint
    static async raiseComplaint({ student_id, hostel_id, type, description, attachments = [] }) {
        const created_time = new Date();
        const sla_hours = SLA_CONFIG[type?.toUpperCase()] || 24;
        const sla_deadline = new Date(created_time.getTime() + sla_hours * 60 * 60 * 1000);

        console.log(`Raising complaint for hostel: ${hostel_id}, student: ${student_id}`);

        const complaint = new Complaint({
            student_id: new mongoose.Types.ObjectId(student_id),
            hostel_id: new mongoose.Types.ObjectId(hostel_id),
            complaint_type: type,
            description,
            status: 'Pending',
            created_time,
            sla_deadline,
            attachments
        });

        await complaint.save();
        return complaint;
    }

    // 2. Fetch Complaints by Hostel (Multi-tenant isolation)
    static async getHostelComplaints(hostel_id, filters = {}) {
        try {
            const query = { hostel_id: new mongoose.Types.ObjectId(hostel_id) };
            if (filters.student_id && filters.student_id !== 'undefined') {
                query.student_id = new mongoose.Types.ObjectId(filters.student_id);
            }
            if (filters.status) query.status = filters.status;
            
            console.log("Fetching complaints with query:", JSON.stringify(query));
            
            const complaints = await Complaint.find(query)
                .populate({ path: 'student_id', select: 'name phone_number room_id', populate: { path: 'room_id', select: 'room_number block' } })
                .populate('worker_id', 'name')
                .sort({ status: -1, sla_deadline: 1, created_time: -1 });

            console.log(`Found ${complaints.length} complaints for query.`);
            return complaints;
        } catch (err) {
            console.error("Error in getHostelComplaints:", err);
            return [];
        }
    }

    // 3. Accept Complaint (Worker claiming from queue)
    static async acceptComplaint(complaint_id, worker_uid) {
        const User = require('../models/User');
        const worker = await User.findOne({ firebase_uid: worker_uid });
        if (!worker) throw new Error('Worker not found');

        const complaint = await Complaint.findByIdAndUpdate(
            complaint_id,
            { 
                worker_id: worker._id, 
                status: 'In Progress' 
            },
            { new: true }
        ).populate('worker_id', 'name');
        
        return complaint;
    }

    // 4. Resolve Complaint (Worker providing proof)
    static async resolveComplaint(complaint_id, proof_image) {
        const update = { 
            status: 'Resolved'
        };
        
        if (proof_image) {
            update.$push = { proof_attachments: proof_image };
        }

        const complaint = await Complaint.findByIdAndUpdate(
            complaint_id,
            update,
            { new: true }
        );
        return complaint;
    }

    // 5. Verify Complaint (Student confirming completion)
    static async markCompleted(complaint_id) {
        const complaint = await Complaint.findByIdAndUpdate(
            complaint_id,
            { 
                status: 'Completed', 
                completed_time: new Date() 
            },
            { new: true }
        ).populate('student_id', 'name');
        
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
