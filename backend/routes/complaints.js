const express = require('express');
const router = express.Router();
const ComplaintService = require('../services/ComplaintService');

router.post('/', async (req, res) => {
    try {
        const result = await ComplaintService.raiseComplaint(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/:hostel_id', async (req, res) => {
    try {
        const result = await ComplaintService.getHostelComplaints(req.params.hostel_id, req.query);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/:id/assign', async (req, res) => {
    try {
        const { worker_id, worker_uid } = req.body;
        let resolved_worker_id = worker_id;
        
        // If no worker_id but worker_uid provided, look up their MongoDB _id
        if (!resolved_worker_id && worker_uid) {
            const User = require('../models/User');
            const worker = await User.findOne({ firebase_uid: worker_uid });
            if (worker) resolved_worker_id = worker._id;
        }
        
        const result = await ComplaintService.assignWorker(req.params.id, resolved_worker_id);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/:id/complete', async (req, res) => {
    try {
        const result = await ComplaintService.markCompleted(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
