const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const admin = require('firebase-admin');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const hostelRoutes = require('./routes/hostel');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/hostels', hostelRoutes);
app.use('/api/rooms', require('./routes/room'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date(), db: mongoose.connection.readyState });
});

app.listen(PORT, () => {
    console.log(`HostelConnect Backend running on port ${PORT}`);
});
