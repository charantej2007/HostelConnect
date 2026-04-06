const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

// POST /api/announcements: Create a new announcement
router.post('/', async (req, res) => {
    try {
        const { admin_id, hostel_id, title, description, attachments, priority, pinned } = req.body;
        
        const announcement = new Announcement({
            admin_id,
            hostel_id,
            title,
            description,
            attachments,
            priority,
            pinned
        });

        await announcement.save();
        res.status(201).json({ message: 'Announcement created successfully', announcement });
    } catch (error) {
        console.error('Failed to create announcement:', error);
        res.status(500).json({ error: 'Server error while creating announcement' });
    }
});

// GET /api/announcements/hostel/:hostelId: Fetch all announcements for a hostel
router.get('/hostel/:hostelId', async (req, res) => {
    try {
        const announcements = await Announcement.find({ hostel_id: req.params.hostelId })
            .sort({ pinned: -1, date: -1 }); // Pinned first, then by date
        res.json(announcements);
    } catch (error) {
        console.error('Failed to fetch announcements:', error);
        res.status(500).json({ error: 'Server error while fetching announcements' });
    }
});

module.exports = router;
