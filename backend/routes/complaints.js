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

router.put('/:id/accept', async (req, res) => {
    try {
        const { worker_uid } = req.body;
        const result = await ComplaintService.acceptComplaint(req.params.id, worker_uid);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/:id/resolve', async (req, res) => {
    try {
        const { proof_image } = req.body;
        const result = await ComplaintService.resolveComplaint(req.params.id, proof_image);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/:id/verify', async (req, res) => {
    try {
        const result = await ComplaintService.markCompleted(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
