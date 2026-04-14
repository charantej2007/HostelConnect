const express = require('express');
const router = express.Router();
const HostelService = require('../services/HostelService');
const verifyAuth = require('../middleware/auth');

// GET /api/hostels/:hostel_id/codes
router.get('/:hostel_id/codes', verifyAuth, async (req, res) => {
    try {
        const result = await HostelService.getHostelCodes(req.params.hostel_id);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET /api/hostels/:hostel_id/info
router.get('/:hostel_id/info', verifyAuth, async (req, res) => {
    try {
        const Hostel = require('../models/Hostel');
        const hostel = await Hostel.findById(req.params.hostel_id);
        if (!hostel) return res.status(404).json({ error: 'Hostel not found' });
        res.json({ hostel });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET /api/hostels/:hostel_id/stats
router.get('/:hostel_id/stats', verifyAuth, async (req, res) => {
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

// POST /api/hostels/:hostel_id/regenerate
router.post('/:hostel_id/regenerate', verifyAuth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const result = await HostelService.regenerateCodes(req.params.hostel_id);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET /api/hostels/admin/current/blocks
router.get('/admin/current/blocks', verifyAuth, async (req, res) => {
    try {
        if (!req.user.hostel_id) return res.status(404).json({ error: 'Hostel not found' });
        const blocks = await HostelService.getBlocksByHostelId(req.user.hostel_id);
        res.json({ blocks });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET /api/hostels/admin-info/current
router.get('/admin-info/current', verifyAuth, async (req, res) => {
    try {
        const User = require('../models/User');
        const Hostel = require('../models/Hostel');
        
        const user = req.user;
        if (!user || user.role !== 'admin' || !user.hostel_id) {
            return res.status(404).json({ error: 'Admin or hostel not found' });
        }
        
        const hostel = await Hostel.findById(user.hostel_id);
        res.json({ user, hostel });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT /api/hostels/admin/current/blocks
router.put('/admin/current/blocks', verifyAuth, async (req, res) => {
    try {
        const { blocks } = req.body;
        if (!req.user.hostel_id) return res.status(404).json({ error: 'Hostel not found' });
        
        const updatedBlocks = await HostelService.updateBlocksByHostelId(req.user.hostel_id, blocks);
        await HostelService.syncRoomsForBlocks(req.user.hostel_id, updatedBlocks);
        res.json({ blocks: updatedBlocks });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT /api/hostels/admin/current/name
router.put('/admin/current/name', verifyAuth, async (req, res) => {
    try {
        const { institution_name } = req.body;
        if (!req.user.hostel_id) return res.status(404).json({ error: 'Hostel not found' });
        
        const updatedName = await HostelService.updateHostelNameByHostelId(req.user.hostel_id, institution_name);
        res.json({ institution_name: updatedName });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
