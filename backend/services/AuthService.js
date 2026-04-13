// AuthService.js - Business Logic for MongoDB & Firebase Auth
const admin = require('firebase-admin');
const Hostel = require('../models/Hostel');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Ensure User model is required

class AuthService {
    // 1. Verify Firebase ID Token (Backend-side authentication)
    static async verifyToken(token) {
        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            return decodedToken;
        } catch (error) {
            throw new Error('Invalid authentication token');
        }
    }

    // 2. Admin Onboarding (Creates Hostel and Admin User)
    static async createHostelAndAdmin({ institutionName, adminName, email, phone, firebase_uid, maxRooms = 10 }) {
        // 1. Check if user already exists
        let user = await User.findOne({ email });
        if (user && user.hostel_id) {
            throw new Error('User with this email already manages a hostel');
        }

        // 2. Create the Admin User first to get an ID
        if (!user) {
            user = new User({
                name: adminName,
                email,
                role: 'admin',
                phone_number: phone,
                firebase_uid
            });
            await user.save();
        } else {
            // Update existing user
            user.name = adminName;
            user.role = 'admin';
            user.phone_number = phone;
            user.firebase_uid = firebase_uid;
            await user.save();
        }

        // 3. Generate unique codes
        const student_code = this.generateUniqueCode('STU');
        const worker_code = this.generateUniqueCode('WRK');

        // 4. Create the Hostel record
        const hostel = new Hostel({
            institution_name: institutionName,
            admin_id: user._id,
            student_code,
            worker_code,
            admin_name: adminName,
            admin_phone: phone,
            admin_email: email
        });
        await hostel.save();

        // 5. Update user with hostel_id
        user.hostel_id = hostel._id;
        await user.save();

        // 6. Return response
        return {
            message: "Hostel management created successfully",
            hostel_id: hostel._id,
            admin: user,
            codes: { student_code, worker_code }
        };
    }

    // 3. Verify Join Code
    static async verifyJoinCode(code, role) {
        const query = role === 'student' ? { student_code: code } : { worker_code: code };
        const hostel = await Hostel.findOne(query);
        if (!hostel) return null;
        return hostel;
    }

    // 4. Complete Onboarding (Detailed Form)
    static async completeOnboarding({ name, email, phone, role, hostel_id, firebase_uid, registration_number, room_id, block }) {
        let user = await User.findOne({ email });
        
        if (user && user.hostel_id) {
            throw new Error('This user is already registered with a hostel');
        }

        // We will resolve room ObjectId later if student.
        let resolvedRoomId = null;

        if (role === 'student' && room_id) {
            const Room = require('../models/Room');
            let room;
            // Support both internal ObjectIds and plain text room numbers (e.g. from text entry)
            if (require('mongoose').Types.ObjectId.isValid(room_id)) {
                room = await Room.findById(room_id);
            } else if (block) {
                // Case-insensitive lookup for typed rooms
                room = await Room.findOne({ hostel_id, block, room_number: { $regex: new RegExp(`^${room_id}$`, 'i') } });
            }

            if (!room) {
                // If room doesn't exist, dynamically provision it so students aren't blocked!
                room = new Room({
                    hostel_id,
                    block,
                    floor: 'Ground Floor',
                    room_number: room_id.toUpperCase(),
                    room_type: '2 Sharing',
                    max_occupancy: 2,
                    amenities: ['Bed', 'Desk', 'Chair', 'WiFi'],
                    current_occupants: []
                });
                await room.save();
            }
            if (room.current_occupants.length >= room.max_occupancy) {
                throw new Error('Selected room is fully occupied');
            }
            resolvedRoomId = room._id;
        }

        if (!user) {
            user = new User({
                name,
                email,
                role,
                phone_number: phone,
                firebase_uid,
                hostel_id,
                registration_number,
                room_id: resolvedRoomId
            });
        } else {
            user.role = role;
            user.hostel_id = hostel_id;
            user.firebase_uid = firebase_uid;
            user.registration_number = registration_number;
            user.room_id = resolvedRoomId;
        }

        await user.save();

        await user.save();

        if (role === 'student' && resolvedRoomId) {
            const Room = require('../models/Room');
            const room = await Room.findById(resolvedRoomId);
            if (room) {
                room.current_occupants.push(user._id);
                await room.save();
            }
        }

        return {
            message: `${role} joined successfully`,
            user
        };
    }

    // 4. Login Sync (Finds user by firebase_uid or email)
    static async syncUser(decodedToken, role, password = null) {
        let user = await User.findOne({ 
            $or: [{ firebase_uid: decodedToken.uid }, { email: decodedToken.email }] 
        }).populate('hostel_id');
        
        // If password is provided, we either hash it for a new user or verify for an existing one
        let passwordHash = null;
        if (password) {
            passwordHash = await bcrypt.hash(password, 10);
        }

        if (!user && role) {
            user = new User({
                name: decodedToken.name || decodedToken.email.split('@')[0],
                email: decodedToken.email,
                firebase_uid: decodedToken.uid,
                role: role,
                password_hash: passwordHash // Store hashed password on signup
            });
            await user.save();
        } else if (user) {
            // Update firebase_uid if it was missing (e.g. legacy account or first time Google login)
            if (!user.firebase_uid) {
                user.firebase_uid = decodedToken.uid;
                await user.save();
            }
            
            // If user exists and password is provided (login/sync session), 
            // we verify it against the stored hash if it exists.
            if (password && user.password_hash) {
                const isMatch = await bcrypt.compare(password, user.password_hash);
                if (!isMatch) {
                    throw new Error('Database password validation failed. Please check your credentials.');
                }
            } else if (password && !user.password_hash) {
                // If user exists but has no hash (e.g. legacy), we can retroactively store it
                user.password_hash = passwordHash;
                await user.save();
            }
        }

        return user;
    }

    // 5. Native MongoDB Signup (Updated to preserve past data)
    static async signup({ name, email, password, role }) {
        let user = await User.findOne({ email });
        
        if (user && user.password_hash) {
            throw new Error('User with this email already exists with a password.');
        }

        const password_hash = await bcrypt.hash(password, 10);

        if (user) {
            // Preservation logic: Update existing record that was created via Google/Firebase sync
            user.password_hash = password_hash;
            user.name = name || user.name;
            user.role = role || user.role;
            await user.save();
        } else {
            // New user creation
            user = new User({
                name,
                email,
                password_hash,
                role
            });
            await user.save();
        }
        
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return { user, token };
    }

    // 6. Native MongoDB Login
    static async login(email, password) {
        const user = await User.findOne({ email }).populate('hostel_id');
        if (!user) {
            throw new Error('User not found');
        }

        if (!user.password_hash) {
            throw new Error('This account was created via Google. Please use "Continue with Google".');
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return { user, token };
    }

    static generateUniqueCode(prefix) {
        return `${prefix}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    }
}

module.exports = AuthService;
