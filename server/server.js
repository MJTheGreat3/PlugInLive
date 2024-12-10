const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { Pool } = require('pg');
const ffmpeg = require('fluent-ffmpeg');

// PostgreSQL configuration
const pool = new Pool({
    user: 'mj',
    host: 'localhost',
    database: 'video_store',
    port: 5432,
});

const app = express();
app.use(cors({
    origin: 'http://localhost:5173', // Allow only your frontend
    methods: ['GET', 'POST'],        // Allow only GET and POST
}));

const port = 3000;

// Ensure 'uploads' directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
destination: (req, file, cb) => {
    cb(null, uploadDir);
},
filename: (req, file, cb) => {
    cb(null, Date.now() + '.webm');
},
});
const upload = multer({ storage });

// Middleware to parse JSON data
app.use(express.json());

// Route to handle video uploads
app.post('/upload', upload.single('video'), async (req, res) => {
    const { texts } = req.body;

    if (!req.file) {
        return res.status(400).send('No video file uploaded.');
    }

    try {
        // Parse texts from JSON string
        const parsedTexts = JSON.parse(texts);

        // Save to PostgreSQL
        const originalVideoPath = req.file.path;
        const convertedVideoPath = originalVideoPath.replace(path.extname(req.file.filename), '.mp4');

        ffmpeg(originalVideoPath)
            .output(convertedVideoPath)
            .on('end', async () => {
                const query = `
                INSERT INTO videos (video_path, texts)
                VALUES ($1, $2)
                RETURNING *;
                `;
                const values = [convertedVideoPath, parsedTexts];
                const result = await pool.query(query, values);

                fs.unlink(originalVideoPath, (err) => {
                    if (err) console.error('Error deleting original file: ', err);
                });

                res.send({
                    message: 'Video and texts uploaded successfully',
                    data: result.rows[0],
                });
            })
            .on('error', (err) => {
                console.error('Error converting video: ', err);
                res.status(500).send('Failed to convert video to MP4 format.');
            })
            .run();
        
    } catch (error) {
        console.error('Error saving to database:', error);
        res.status(500).send('Failed to save data.');
    }
});

// Start the server
app.listen(port, () => {
console.log(`Server is running on http://localhost:${port}`);
});