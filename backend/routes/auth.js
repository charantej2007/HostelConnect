const express = require('express');
const router = express.Router();
const AuthService = require('../services/AuthService');
const verifyAuth = require('../middleware/auth');

/**
 * POST /api/auth/register
 * Method: Email/Password Signup
 */
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        console.log(`[Auth] Registration attempt: ${email}`);
        const result = await AuthService.signup({ name, email, password, role });
        res.status(201).json(result);
    } catch (error) {
        console.error(`[Auth Error] Registration: ${error.message}`);
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/auth/login
 * Method: Email/Password Login
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`[Auth] Login attempt: ${email}`);
        const result = await AuthService.login(email, password);
        res.json(result);
    } catch (error) {
        console.error(`[Auth Error] Login: ${error.message}`);
        res.status(401).json({ error: error.message });
    }
});

/**
 * POST /api/auth/google
 * Method: Firebase Google Auth Sync
 */
router.post('/google', async (req, res) => {
    try {
        const { email, name, firebase_uid, role } = req.body;
        console.log(`[Auth] Google Sync attempt: ${email}`);
        const result = await AuthService.googleAuth({ email, name, firebase_uid, role });
        res.json(result);
    } catch (error) {
        console.error(`[Auth Error] Google Sync: ${error.message}`);
        res.status(400).json({ error: error.message });
    }
});

/**
 * GET /api/auth/me
 * Method: Get current user profile (using JWT)
 */
router.get('/me', verifyAuth, async (req, res) => {
    res.json({ user: req.user });
});

/**
 * POST /api/auth/admin-signup
 */
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

/**
 * POST /api/auth/verify-code
 */
router.post('/verify-code', async (req, res) => {
    try {
        const { code, role } = req.body;
        const hostel = await AuthService.verifyJoinCode(code, role);
        if (!hostel) {
            return res.status(400).json({ error: `Invalid Join Code for ${role} role` });
        }
        res.status(200).json({ 
            message: "Code verified", 
            hostel_id: hostel._id, 
            hostel_name: hostel.institution_name 
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/auth/complete-onboarding
 */
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

/**
 * PUT /api/auth/user/current
 * Method: Update current user's profile
 */
router.put('/user/current', verifyAuth, async (req, res) => {
    try {
        const { name, phone_number } = req.body;
        const User = require('../models/User');
        const user = await User.findByIdAndUpdate(
            req.user._id, 
            { ...(name && { name }), ...(phone_number && { phone_number }) },
            { new: true }
        ).populate('hostel_id');
        res.json({ user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
