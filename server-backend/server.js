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
    console.log('🔄 Checking if MongoDB is installed...');
    
    exec('mongod --version', (error, stdout, stderr) => {
        if (error) {
            console.error('❌ MongoDB is not installed or not in PATH.');
            console.error('🔹 Install MongoDB from: https://www.mongodb.com/try/download/community');
            console.error('📄 Full Error:', error);
            process.exit(1);
        }

        console.log('✅ MongoDB version detected:', stdout.trim());

        console.log('🔄 Attempting to start MongoDB...');
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
    
    mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
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

// ✅ FIX: Ensure GridFS Storage is properly defined
const storage = new GridFsStorage({
    url: mongoURI,
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: async (req, file) => {
        return {
            filename: file.originalname,
            bucketName: 'uploads',
            metadata: { uploadedAt: new Date() }
        };
    }
});
const upload = multer({ storage });

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

// ✅ FIX: Ensure MongoDB is connected before allowing uploads
app.post('/upload', (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(500).json({ message: '❌ MongoDB is not connected. Please try again later.' });
    }

    upload.single('objFile')(req, res, async (err) => {
        console.log('📂 Uploaded File Data:', req.file); // ✅ Debugging Log

        if (err) {
            return res.status(500).json({ message: '❌ File upload failed', error: err.message });
        }

        console.log('📂 Uploaded File Data:', req.file); // ✅ Debugging Log

        if (!req.file || !req.file.id) {
            console.log('⚠️ req.file.id is missing, manually fetching from MongoDB...');
            try {
                const file = await mongoose.connection.db.collection('uploads.files')
                    .findOne({ filename: req.file.filename });

                if (!file) {
                    return res.status(500).json({ message: '❌ File upload failed. Could not retrieve `_id`.' });
                }

                return res.json({
                    message: '✅ File uploaded successfully',
                    fileId: file._id
                });
            } catch (dbErr) {
                return res.status(500).json({ message: '❌ Database error retrieving `_id`.', error: dbErr.message });
            }
        }

        res.json({
            message: '✅ File uploaded successfully',
            fileId: req.file.id
        });
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
