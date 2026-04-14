const express = require('express');
const router = express.Router();
const ComplaintService = require('../services/ComplaintService');
const verifyAuth = require('../middleware/auth');

// POST /api/complaints
router.post('/', verifyAuth, async (req, res) => {
    try {
        const { type, description, attachments } = req.body;
        const result = await ComplaintService.raiseComplaint({
            student_id: req.user._id,
            hostel_id: req.user.hostel_id,
            type,
            description,
            attachments
        });
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET /api/complaints/:hostel_id
router.get('/:hostel_id', verifyAuth, async (req, res) => {
    try {
        // Enforce that user can only see their own hostel's complaints
        // hostel_id may be populated (object) or a raw ObjectId — handle both
        const userHostelId = req.user.hostel_id?._id || req.user.hostel_id;
        if (!userHostelId || userHostelId.toString() !== req.params.hostel_id) {
            return res.status(403).json({ error: 'Access denied to this hostel' });
        }
        
        const filters = { ...req.query };
        if (req.user.role === 'student') {
            filters.student_id = req.user._id;
        }

        const result = await ComplaintService.getHostelComplaints(req.params.hostel_id, filters);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT /api/complaints/:id/accept
router.put('/:id/accept', verifyAuth, async (req, res) => {
    try {
        if (req.user.role !== 'worker') return res.status(403).json({ error: 'Only workers can accept complaints' });
        const result = await ComplaintService.acceptComplaint(req.params.id, req.user._id);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT /api/complaints/:id/resolve
router.put('/:id/resolve', verifyAuth, async (req, res) => {
    try {
        const { proof_image } = req.body;
        const result = await ComplaintService.resolveComplaint(req.params.id, proof_image);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT /api/complaints/:id/verify
router.put('/:id/verify', verifyAuth, async (req, res) => {
    try {
        const result = await ComplaintService.markCompleted(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
