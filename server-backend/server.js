const { exec } = require('child_process');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const { GridFsStorage } = require('multer-gridfs-storage');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const mongoURI = 'mongodb://127.0.0.1:27017/objFiles';

// Function to start MongoDB automatically
const startMongoDB = () => {
    console.log('🔄 Checking if MongoDB is running...');
    
    exec('mongod --version', (error, stdout, stderr) => {
        if (error) {
            console.error('❌ MongoDB is not installed or not in PATH. Please install MongoDB.');
            console.error(error)

            process.exit(1);
        }

        // Start MongoDB if not already running
        exec('mongod --dbpath ./data/db --logpath ./data/mongo.log --fork', (err, stdout, stderr) => {
            if (err) {
                console.error('⚠️ MongoDB might already be running or failed to start.');
            } else {
                console.log('✅ MongoDB started successfully.');
            }
            connectToMongoDB(); // Proceed to connect after attempting to start
        });
    });
};

// Function to connect to MongoDB
const connectToMongoDB = () => {
    console.log('🔄 Attempting to connect to MongoDB...');
    
    mongoose.connect(mongoURI)
        .then(() => console.log('✅ MongoDB Connected Successfully'))
        .catch(err => {
            console.error('❌ MongoDB Connection Failed:', err.message);
            console.log('🔁 Retrying in 5 seconds...');
            setTimeout(connectToMongoDB, 5000);
        });
};

// Start MongoDB first, then connect
startMongoDB();

// Initialize GridFS once MongoDB is connected
const conn = mongoose.connection;
let gfs;
conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
    console.log('✅ GridFS Initialized');
});

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

// Upload File
app.post('/upload', (req, res) => {
    if (!conn.readyState) {
        return res.status(500).json({ message: '❌ MongoDB is not connected. Please try again later.' });
    }

    const upload = multer({ storage }).single('objFile');
    upload(req, res, (err) => {
        if (err) {
            return res.status(500).json({ message: '❌ File upload failed', error: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ message: '❌ No file uploaded' });
        }
        res.json({ message: '✅ File uploaded successfully', fileId: req.file.id });
    });
});

// Retrieve File
app.get('/file/:filename', (req, res) => {
    if (!gfs) {
        return res.status(500).json({ message: '❌ GridFS is not initialized' });
    }
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        if (!file || file.length === 0) {
            return res.status(404).json({ message: '❌ File not found' });
        }
        const readStream = gfs.createReadStream(file.filename);
        readStream.pipe(res);
    });
});

// Serve Viewer Page
app.get('/viewer', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'viewer.html'));
});

// Root Route
app.get('/', (req, res) => {
    res.send('🚀 Welcome to the Express API!');
});

// Start Server
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
