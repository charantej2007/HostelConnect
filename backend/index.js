const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const hostelRoutes = require('./routes/hostel');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        console.error('CRITICAL: Firebase environment variables are missing!');
        process.exit(1);
    }

    // Sanitize private key: handle double backslashes and surrounding quotes
    privateKey = privateKey.replace(/\\n/g, '\n');
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.substring(1, privateKey.length - 1);
    }

    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });
        console.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
        console.error('Firebase Admin SDK initialization failed:', error);
        process.exit(1);
    }
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Middleware - CORS allows Vercel frontend and local dev
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        /\.vercel\.app$/,       // any Vercel preview/prod URL
        /\.onrender\.com$/,     // Render itself
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/hostels', hostelRoutes);
app.use('/api/rooms', require('./routes/room'));
app.use('/api/announcements', require('./routes/announcements'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date(), db: mongoose.connection.readyState });
});

app.listen(PORT, () => {
    console.log(`HostelConnect Backend running on port ${PORT}`);
});
