const express = require('express');
const router = express.Router();
const Room = require('../models/Room');

// GET /api/rooms/student/:uid
// Get the specific room a student is assigned to
router.get('/student/:uid', async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findOne({ firebase_uid: req.params.uid })
            .populate('room_id')
            .populate('hostel_id');
        
        if (!user || user.role !== 'student' || !user.room_id) {
            return res.status(404).json({ error: 'Room not found for student' });
        }
        
        // Populate current occupants
        const room = await Room.findById(user.room_id._id)
            .populate('current_occupants', 'name _id');
        
        res.json({ 
            room, 
            hostel: user.hostel_id,
            user 
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET /api/rooms/:hostel_id
// Get all available rooms for a hostel, separated by blocks
router.get('/:hostel_id', async (req, res) => {
    try {
        const Hostel = require('../models/Hostel');
        const hostel = await Hostel.findById(req.params.hostel_id);
        
        let blocks = [];
        if (hostel.blocks && hostel.blocks.length > 0) {
            blocks = hostel.blocks.map(b => b.blockName);
        } else {
            blocks = ['Block A', 'Block B']; // fallback generic
        }
    
        const rooms = await Room.find({ hostel_id: req.params.hostel_id });
        
        const result = {
            blocks,
            rooms: rooms.map(room => ({
                id: room._id,
                block: room.block,
                floor: room.floor,
                room_number: room.room_number,
                room_type: room.room_type,
                max_occupancy: room.max_occupancy,
                current_occupancy: room.current_occupants.length,
                isFull: room.current_occupants.length >= room.max_occupancy,
                amenities: room.amenities
            }))
        };
        
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET /api/rooms/detail/:room_id
// Fetch full room details including populated occupants
router.get('/detail/:room_id', async (req, res) => {
    try {
        const room = await Room.findById(req.params.room_id)
            .populate('current_occupants', 'name email profile_pic _id');
        
        if (!room) return res.status(404).json({ error: 'Room not found' });
        res.json(room);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
