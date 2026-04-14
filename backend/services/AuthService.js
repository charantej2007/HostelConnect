// AuthService.js - Completely Rebuilt for Single-Step Email & Google Auth
const admin = require('firebase-admin');
const Hostel = require('../models/Hostel');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
    /**
     * NATIVE EMAIL/PASSWORD SIGNUP
     * Logic: Simple one-step registration without OTP.
     */
    static async signup({ name, email, password, role }) {
        if (!email || !password || !role) {
            throw new Error('Email, password, and role are required');
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        const password_hash = await bcrypt.hash(password, 10);

        const user = new User({
            name: name || email.split('@')[0],
            email: email.toLowerCase(),
            password_hash,
            role
        });

        await user.save();

        const token = this.generateSessionToken(user);
        return { user, token };
    }

    /**
     * NATIVE EMAIL/PASSWORD LOGIN
     */
    static async login(email, password) {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        const user = await User.findOne({ email: email.toLowerCase() }).populate('hostel_id');
        if (!user) {
            throw new Error('User not found. Please Sign Up first.');
        }

        if (!user.password_hash) {
            throw new Error('This account was created via Google. Please use "Continue with Google" or Sign Up to set a password.');
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            throw new Error('Invalid email or password.');
        }

        const token = this.generateSessionToken(user);
        return { user, token };
    }

    /**
     * GOOGLE AUTHENTICATION (Firebase Token Based)
     * Logic: Verifies UID/Email and finds or creates the user record.
     */
    static async googleAuth({ email, name, firebase_uid, role }) {
        if (!email || !firebase_uid) {
            throw new Error('Email and Firebase UID are required for Google Auth');
        }

        // Try finding by UID first, then Email
        let user = await User.findOne({ 
            $or: [{ firebase_uid }, { email: email.toLowerCase() }] 
        }).populate('hostel_id');

        if (!user) {
            if (!role) {
                // Return a specific flag so frontend knows to ask for role
                return { needsOnboarding: true, email, name, firebase_uid };
            }

            user = new User({
                name,
                email: email.toLowerCase(),
                firebase_uid,
                role
            });
            await user.save();
        } else {
            // Update UID if it was missing (e.g. user previously signed up via email)
            if (!user.firebase_uid) {
                user.firebase_uid = firebase_uid;
                await user.save();
            }
        }

        const token = this.generateSessionToken(user);
        return { user, token };
    }

    /**
     * ADMIN/HOSTEL CREATION
     */
    static async createHostelAndAdmin({ institutionName, adminName, email, phone, firebase_uid, maxRooms = 10 }) {
        let user = await User.findOne({ email: email.toLowerCase() });
        
        if (user && user.hostel_id) {
            throw new Error('User already manages a hostel');
        }

        if (!user) {
            user = new User({
                name: adminName,
                email: email.toLowerCase(),
                role: 'admin',
                phone_number: phone,
                firebase_uid
            });
            await user.save();
        } else {
            user.name = adminName;
            user.role = 'admin';
            user.phone_number = phone;
            if (firebase_uid) user.firebase_uid = firebase_uid;
            await user.save();
        }

        const student_code = this.generateUniqueCode('STU');
        const worker_code = this.generateUniqueCode('WRK');

        const hostel = new Hostel({
            institution_name: institutionName,
            admin_id: user._id,
            student_code,
            worker_code,
            admin_name: adminName,
            admin_phone: phone,
            admin_email: email.toLowerCase()
        });
        await hostel.save();

        user.hostel_id = hostel._id;
        await user.save();

        const token = this.generateSessionToken(user);
        return { message: "Hostel created", user, token, codes: { student_code, worker_code } };
    }

    /**
     * COMPLETE ONBOARDING (For Students/Workers after Google Login)
     */
    static async completeOnboarding({ name, email, phone, role, hostel_id, firebase_uid, registration_number, room_id, block }) {
        let user = await User.findOne({ email: email.toLowerCase() });
        
        if (user && user.hostel_id) {
            throw new Error('User already registered with a hostel');
        }

        if (!user) {
            user = new User({
                name,
                email: email.toLowerCase(),
                role,
                phone_number: phone,
                firebase_uid,
                hostel_id,
                registration_number
            });
        } else {
            user.role = role;
            user.hostel_id = hostel_id;
            user.phone_number = phone;
            user.registration_number = registration_number;
            if (firebase_uid) user.firebase_uid = firebase_uid;
        }

        await user.save();

        const token = this.generateSessionToken(user);
        return { message: "Onboarding complete", user, token };
    }

    static generateSessionToken(user) {
        return jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
    }

    static generateUniqueCode(prefix) {
        return `${prefix}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    }

    static async verifyJoinCode(code, role) {
        const query = role === 'student' ? { student_code: code } : { worker_code: code };
        return await Hostel.findOne(query);
    }
}

module.exports = AuthService;
