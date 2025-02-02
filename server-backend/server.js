const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const { GridFsStorage } = require('multer-gridfs-storage');
const itemsRoutes = require('./routes/items');

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Connection
const mongoURI = 'mongodb://localhost:27017/objFiles';
const conn = mongoose.createConnection(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
let gfs;
conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
    console.log('Connected to MongoDB');
});

// Multer GridFS Storage
const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
        return { filename: file.originalname, bucketName: 'uploads' };
    }
});
const upload = multer({ storage });

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

// Use API routes
app.use('/api', itemsRoutes);

// Upload OBJ file to MongoDB
app.post('/upload', upload.single('objFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({ message: 'File uploaded successfully', fileId: req.file.id });
});

// Retrieve OBJ file from MongoDB
app.get('/file/:filename', async (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        if (!file || file.length === 0) {
            return res.status(404).json({ message: 'File not found' });
        }
        const readStream = gfs.createReadStream(file.filename);
        readStream.pipe(res);
    });
});

// Serve OBJ file viewer page
app.get('/viewer', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'viewer.html'));
});

app.get('/', (req, res) => {
    res.send('Welcome to the Express API!');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
