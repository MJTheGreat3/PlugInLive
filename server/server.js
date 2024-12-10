const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { Pool } = require('pg');
const ffmpeg = require('fluent-ffmpeg');
const {google} = require('googleapis');
const fs = require('fs');

//^ Section 1 : Drive Handling

const auth = new google.auth.GoogleAuth({
  keyFile: 'path/to/service-account-key.json',
  scopes: ['https://www.googleapis.com/auth/drive'],
});

/*
* @usage 
    uploadFile({ 
        src: './path/to/video.mp4', 
        name: 'UploadedVideo.mp4' 
    });
*/
async function uploadFile({src, name}) {
  try {
    const authClient = await auth.getClient();
    const driveClient = google.drive({ version: 'v3', auth: authClient });

    const fileMetadata = {
        name: name, // File name in Google Drive
        parents: ['YOUR_FOLDER_ID'], // Parent folder in Drive
    };

    const media = {
        mimeType: 'video/mp4', // encoding type
        body: fs.createReadStream(src), // file src
    };

    const response = await driveClient.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id',
    });

    console.log('Uploaded file ID:', response.data.id);
  } catch (e) {
    console.error('Error uploading file:', error.message);
  }
}

//^ Section 2: Assembly AI handling

require('dotenv').config();
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
/* 
* @usage
    const fileUploadResponse = await uploadFileToAssemblyAI(filePath);
*/ 
// Upload file to AssemblyAI
async function uploadFileToAssemblyAI(filePath) {
  const file = fs.readFileSync(filePath);

  const response = await axios.post(
    'https://api.assemblyai.com/v2/upload',
    file,
    {
      headers: {
        authorization: ASSEMBLYAI_API_KEY,
        'content-type': 'application/octet-stream',
      },
    }
  );

  return response.data;
}

/*
* @usage
    const transcriptionResponse = await requestTranscription(fileUploadResponse.upload_url);

*/
// Helper: Request transcription
async function requestTranscription(uploadUrl) {
  const response = await axios.post(
    'https://api.assemblyai.com/v2/transcript',
    {
      audio_url: uploadUrl,
    },
    {
      headers: {
        authorization: ASSEMBLYAI_API_KEY,
        'content-type': 'application/json',
      },
    }
  );

  return response.data;
}

// Get transcription status and result
async function getTranscription({transcriptionId}) {
  try {
    const response = await axios.get(
      `https://api.assemblyai.com/v2/transcript/${transcriptionId}`,
      {
        headers: { authorization: ASSEMBLYAI_API_KEY },
      }
    );
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'An error occurred while fetching the transcription.' });
  }

  return response.data;
};

//^ Section 3: PostgreSQL configuration
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