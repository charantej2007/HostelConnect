const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Unified Authentication Middleware
 * Supports both Native JWT (for Email users) and Firebase ID Tokens (for Google users)
 */
const verifyAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authorization header missing or malformed' });
        }

        const token = authHeader.split(' ')[1];

        // 1. Try Native JWT first (for Email/Password users)
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).populate('hostel_id');
            if (user) {
                req.user = user;
                return next();
            }
        } catch (jwtError) {
            // Not a valid native JWT, continue to Firebase
        }

        // 2. Try Firebase ID Token (for Google users)
        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            const user = await User.findOne({ 
                $or: [{ firebase_uid: decodedToken.uid }, { email: decodedToken.email }] 
            }).populate('hostel_id');

            if (!user) {
                return res.status(401).json({ error: 'User not registered in database' });
            }

            req.user = user;
            return next();
        } catch (firebaseError) {
            return res.status(401).json({ error: 'Authentication failed: Invalid token' });
        }

    } catch (error) {
        console.error('Auth Middleware Error:', error);
        res.status(500).json({ error: 'Internal server error during authentication' });
    }
};

module.exports = verifyAuth;
