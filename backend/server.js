const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');
const { google } = require("googleapis");
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
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
async function getTranscription({ transcriptionId }) {
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

const PORT = 3000;

// Ensure 'uploads' directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// PostgreSQL pool setup
const pool = new Pool({
  user: 'mj',
  host: 'localhost',
  database: 'video_store',
  port: 5432,
});

// Load Google Drive credentials
const TOKEN_PATH = path.join(__dirname, "credentials.json");
const CLIENT_SECRET_PATH = path.join(__dirname, "client_secret.json");

let drive;

// Initialize Google Drive API
fs.readFile(CLIENT_SECRET_PATH, (err, content) => {
  if (err) {
    console.error("Error loading client secret file:", err);
    return;
  }
  authorize(JSON.parse(content));
});

function authorize(credentials) {
  const { client_id, client_secret, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) {
      console.error("Error reading token file:", err);
      return;
    }
    oAuth2Client.setCredentials(JSON.parse(token));
    drive = google.drive({ version: "v3", auth: oAuth2Client });
    console.log("Google Drive API initialized successfully.");
  });
}

// Transcode video to MP4 format
function transcodeToMp4(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat('mp4')
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .save(outputPath);
  });
}

// Upload file to a specific Google Drive folder
async function uploadFileToGoogleDrive(filePath, fileName, folderId) {
  try {
    const fileMetadata = { name: fileName, parents: [folderId] }; // Save in specific folder
    const media = { mimeType: "video/mp4", body: fs.createReadStream(filePath) };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id",
    });

    console.log("Uploaded file ID:", response.data.id);
    return response.data.id;
  } catch (error) {
    console.error("Error uploading file to Google Drive:", error.message);
    throw new Error("Failed to upload to Google Drive");
  }
}

// Function to insert video response into the database
async function saveResponseToDatabase(userId, question, driveFileId) {
  const query = `
        INSERT INTO responses (user_id, question, drive_file_id, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING id;
    `;
  const values = [userId, question, driveFileId];

  try {
    const result = await pool.query(query, values);
    console.log("Response saved to database with ID:", result.rows[0].id);
  } catch (error) {
    console.error("Error saving response to database:", error.message);
    throw new Error("Failed to save response to database");
  }
}

// API Route to handle video uploads
app.post("/upload", upload.single("video"), async (req, res) => {
  const { userId, question } = req.body;
  const video = req.file;

  if (!video) {
    return res.status(400).send("No video file uploaded.");
  }

  const filePath = video.path;
  const mp4FilePath = path.join(uploadDir, `${Date.now()}-converted.mp4`);
  const fileName = video.originalname.replace(/\.[^/.]+$/, "") + ".mp4";
  const folderId = "1Eqabl8yhSbMK6zV7PZNdkerXVMIRucDu";

  try {
    // Convert video to MP4 format
    await transcodeToMp4(filePath, mp4FilePath);

    // Upload MP4 file to Google Drive
    const driveFileId = await uploadFileToGoogleDrive(mp4FilePath, fileName, folderId);

    // Save the response to the database
    await saveResponseToDatabase(userId || 1, question, driveFileId);

    res.status(200).send({
      message: "Video uploaded successfully!",
      fileId: driveFileId,
      question,
      userId,
    });

    // Delete the files locally after successful upload
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting original file:", err);
    });
    fs.unlink(mp4FilePath, (err) => {
      if (err) console.error("Error deleting MP4 file:", err);
    });
  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).send("Failed to upload video.");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
