// HostelService.js - Management of Hostel Data and Codes (MongoDB)
const Hostel = require('../models/Hostel');
const crypto = require('crypto');

class HostelService {
    // 1. Fetch Hostel Details
    static async getHostelById(hostel_id) {
        return await Hostel.findById(hostel_id).populate('admin_id', 'name email');
    }

    // 2. Fetch Join Codes (Admin Only)
    static async getHostelCodes(hostel_id) {
        const hostel = await Hostel.findById(hostel_id);
        if (!hostel) throw new Error('Hostel not found');
        
        return {
            hostel_id,
            student_code: hostel.student_code,
            worker_code: hostel.worker_code
        };
    }

    // 3. Reset Join Codes (Admin Only)
    static async regenerateCodes(hostel_id) {
        const student_code = `STU-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        const worker_code = `WRK-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        
        const hostel = await Hostel.findByIdAndUpdate(
            hostel_id,
            { student_code, worker_code },
            { new: true }
        );

        return {
            hostel_id,
            student_code: hostel.student_code,
            worker_code: hostel.worker_code,
            message: "Join codes rotated successfully"
        };
    }

    // 4. Get blocks for an admin
    static async getBlocksByAdminUid(firebase_uid) {
        const User = require('../models/User');
        const user = await User.findOne({ firebase_uid }).populate('hostel_id');
        if (!user || user.role !== 'admin' || !user.hostel_id) {
            throw new Error('Not authorized or hostel not found');
        }
        return user.hostel_id.blocks || [];
    }

    // 5. Update blocks for an admin
    static async updateBlocksByAdminUid(firebase_uid, blocks) {
        const User = require('../models/User');
        const user = await User.findOne({ firebase_uid });
        if (!user || user.role !== 'admin' || !user.hostel_id) {
            throw new Error('Not authorized or hostel not found');
        }
        const hostel = await Hostel.findByIdAndUpdate(
            user.hostel_id,
            { blocks },
            { new: true }
        );
        return hostel.blocks;
    }

    // 6. Update institution name for an admin
    static async updateHostelNameByAdminUid(firebase_uid, institution_name) {
        const User = require('../models/User');
        const user = await User.findOne({ firebase_uid });
        if (!user || user.role !== 'admin' || !user.hostel_id) {
            throw new Error('Not authorized or hostel not found');
        }
        const hostel = await Hostel.findByIdAndUpdate(
            user.hostel_id,
            { institution_name },
            { new: true }
        );
        return hostel.institution_name;
    }

    // 7. Synchronize Rooms for specific blocks
    static async syncRoomsForBlocks(admin_uid, blocks) {
        const user = await require('../models/User').findOne({ firebase_uid: admin_uid });
        if (!user || user.role !== 'admin') return;
        const hostel_id = user.hostel_id;
        const Room = require('../models/Room');
        
        for (const block of blocks) {
            const existingRooms = await Room.countDocuments({ hostel_id, block: block.blockName });
            if (existingRooms === 0) {
                // Auto-generate 10 generic rooms for this new block so students have selectable choices natively.
                const docs = [];
                for(let i=1; i<=10; i++) {
                    docs.push({
                        hostel_id,
                        block: block.blockName,
                        floor: i < 5 ? '1st Floor' : '2nd Floor',
                        room_number: `${block.blockName.charAt(0)}-${100+i}`,
                        room_type: '2 Sharing',
                        max_occupancy: 2,
                        amenities: ['Bed', 'WiFi', 'Desk'],
                        current_occupants: []
                    });
                }
                await Room.insertMany(docs);
            }
        }
    }
}

module.exports = HostelService;
