const express = require('express');
const router = express.Router();
const HostelService = require('../services/HostelService');

router.get('/:hostel_id/codes', async (req, res) => {
    try {
        const result = await HostelService.getHostelCodes(req.params.hostel_id);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET /api/hostels/:hostel_id/info - Full hostel details including blocks (for all roles)
router.get('/:hostel_id/info', async (req, res) => {
    try {
        const Hostel = require('../models/Hostel');
        const hostel = await Hostel.findById(req.params.hostel_id);
        if (!hostel) return res.status(404).json({ error: 'Hostel not found' });
        res.json({ hostel });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/:hostel_id/stats', async (req, res) => {
    try {
        const User = require('../models/User');
        const Complaint = require('../models/Complaint');
        
        const totalStudents = await User.countDocuments({ hostel_id: req.params.hostel_id, role: 'student' });
        const totalWorkers = await User.countDocuments({ hostel_id: req.params.hostel_id, role: 'worker' });
        const pendingComplaints = await Complaint.countDocuments({ hostel_id: req.params.hostel_id, status: 'Pending' });
        const resolvedComplaints = await Complaint.countDocuments({ hostel_id: req.params.hostel_id, status: 'Resolved' });
        const inProgressComplaints = await Complaint.countDocuments({ hostel_id: req.params.hostel_id, status: 'In Progress' });
        const completedComplaints = await Complaint.countDocuments({ hostel_id: req.params.hostel_id, status: 'Completed' });
        const totalComplaints = pendingComplaints + resolvedComplaints + inProgressComplaints + completedComplaints;
        
        res.json({
            totalStudents,
            totalWorkers,
            complaints: {
                total: totalComplaints,
                pending: pendingComplaints,
                in_progress: inProgressComplaints,
                resolved: resolvedComplaints,
                completed: completedComplaints
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/:hostel_id/regenerate', async (req, res) => {
    try {
        const result = await HostelService.regenerateCodes(req.params.hostel_id);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/admin/:uid/blocks', async (req, res) => {
    try {
        const blocks = await HostelService.getBlocksByAdminUid(req.params.uid);
        res.json({ blocks });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/admin-info/:uid', async (req, res) => {
    try {
        const User = require('../models/User');
        const Hostel = require('../models/Hostel');
        
        const user = await User.findOne({ firebase_uid: req.params.uid });
        if (!user || user.role !== 'admin' || !user.hostel_id) {
            return res.status(404).json({ error: 'Admin or hostel not found' });
        }
        
        const hostel = await Hostel.findById(user.hostel_id);
        res.json({ user, hostel });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/admin/:uid/blocks', async (req, res) => {
    try {
        const { blocks } = req.body;
        const updatedBlocks = await HostelService.updateBlocksByAdminUid(req.params.uid, blocks);
        await HostelService.syncRoomsForBlocks(req.params.uid, updatedBlocks);
        res.json({ blocks: updatedBlocks });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/admin/:uid/name', async (req, res) => {
    try {
        const { institution_name } = req.body;
        const updatedName = await HostelService.updateHostelNameByAdminUid(req.params.uid, institution_name);
        res.json({ institution_name: updatedName });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
