const express = require('express');
const router = express.Router();
const AuthService = require('../services/AuthService');

// POST /api/auth/verify-and-sync
// Logic: Verifies Firebase ID Token and finds/creates the user record in MongoDB.
router.post('/sync', async (req, res) => {
    try {
        const { idToken, role } = req.body;
        const decodedToken = await AuthService.verifyToken(idToken);
        const user = await AuthService.syncUser(decodedToken, role);
        
        if (!user || !user.hostel_id) {
            return res.status(200).json({ 
                needsOnboarding: true, 
                decodedToken,
                user
            });
        }
        
        res.json({ user });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

// POST /api/auth/admin-signup
router.post('/admin-signup', async (req, res) => {
    try {
        const { institutionName, adminName, email, phone, firebase_uid, maxRooms } = req.body;
        const result = await AuthService.createHostelAndAdmin({ 
            institutionName, adminName, email, phone, firebase_uid, maxRooms 
        });
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// POST /api/auth/verify-code
router.post('/verify-code', async (req, res) => {
    try {
        const { code, role } = req.body;
        const hostel = await AuthService.verifyJoinCode(code, role);
        if (!hostel) {
            return res.status(400).json({ error: `Invalid Join Code for ${role} role` });
        }
        res.status(200).json({ message: "Code verified", hostel_id: hostel._id, hostel_name: hostel.institution_name });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// POST /api/auth/complete-onboarding
router.post('/complete-onboarding', async (req, res) => {
    try {
        const { name, email, phone, firebase_uid, role, hostel_id, registration_number, room_id, block } = req.body;
        const result = await AuthService.completeOnboarding({ 
            name, email, phone, firebase_uid, role, hostel_id, registration_number, room_id, block
        });
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET /api/auth/user/:uid
router.get('/user/:uid', async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findOne({ firebase_uid: req.params.uid }).populate('hostel_id').populate('room_id');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user, hostel: user.hostel_id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT /api/auth/user/:uid  - Update profile
router.put('/user/:uid', async (req, res) => {
    try {
        const User = require('../models/User');
        const { name, phone_number } = req.body;
        const user = await User.findOneAndUpdate(
            { firebase_uid: req.params.uid },
            { ...(name && { name }), ...(phone_number && { phone_number }) },
            { new: true }
        );
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
