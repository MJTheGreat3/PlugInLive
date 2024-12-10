const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { Pool } = require('pg');
const { google } = require("googleapis");
const ffmpeg = require('fluent-ffmpeg');

// const {google} = require('googleapis');

//^ Section 1 : Drive Handling

// const auth = new google.auth.GoogleAuth({
//   keyFile: 'path/to/service-account-key.json',
//   scopes: ['https://www.googleapis.com/auth/drive'],
// });

// /*
// * @usage 
//     uploadFile({ 
//         src: './path/to/video.mp4', 
//         name: 'UploadedVideo.mp4' 
//     });
// */
// async function uploadFile({src, name}) {
//   try {
//     const authClient = await auth.getClient();
//     const driveClient = google.drive({ version: 'v3', auth: authClient });

//     const fileMetadata = {
//         name: name, // File name in Google Drive
//         parents: ['YOUR_FOLDER_ID'], // Parent folder in Drive
//     };

//     const media = {
//         mimeType: 'video/mp4', // encoding type
//         body: fs.createReadStream(src), // file src
//     };

//     const response = await driveClient.files.create({
//         requestBody: fileMetadata,
//         media: media,
//         fields: 'id',
//     });

//     console.log('Uploaded file ID:', response.data.id);
//   } catch (e) {
//     console.error('Error uploading file:', error.message);
//   }
// }

// //^ Section 2: Assembly AI handling

// require('dotenv').config();
// const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
// /* 
// * @usage
//     const fileUploadResponse = await uploadFileToAssemblyAI(filePath);
// */ 
// // Upload file to AssemblyAI
// async function uploadFileToAssemblyAI(filePath) {
//   const file = fs.readFileSync(filePath);

//   const response = await axios.post(
//     'https://api.assemblyai.com/v2/upload',
//     file,
//     {
//       headers: {
//         authorization: ASSEMBLYAI_API_KEY,
//         'content-type': 'application/octet-stream',
//       },
//     }
//   );

//   return response.data;
// }

// /*
// * @usage
//     const transcriptionResponse = await requestTranscription(fileUploadResponse.upload_url);

// */
// // Helper: Request transcription
// async function requestTranscription(uploadUrl) {
//   const response = await axios.post(
//     'https://api.assemblyai.com/v2/transcript',
//     {
//       audio_url: uploadUrl,
//     },
//     {
//       headers: {
//         authorization: ASSEMBLYAI_API_KEY,
//         'content-type': 'application/json',
//       },
//     }
//   );

//   return response.data;
// }

// // Get transcription status and result
// async function getTranscription({transcriptionId}) {
//   try {
//     const response = await axios.get(
//       `https://api.assemblyai.com/v2/transcript/${transcriptionId}`,
//       {
//         headers: { authorization: ASSEMBLYAI_API_KEY },
//       }
//     );
//   } catch (error) {
//     console.error('Error:', error.message);
//     res.status(500).json({ error: 'An error occurred while fetching the transcription.' });
//   }

//   return response.data;
// };

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

// Load Google Drive credentials
const TOKEN_PATH = path.join(__dirname, "credentials.json");
const CLIENT_SECRET_PATH = path.join(__dirname, "client_secret_780811699902-co7urandbrpl98v1ve64ntq4cc3uus4u.apps.googleusercontent.com.json");

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

// Upload file to Google Drive
async function uploadFileToGoogleDrive(filePath, fileName) {
  try {
    const fileMetadata = { name: fileName };
    const media = { mimeType: "video/webm", body: fs.createReadStream(filePath) };

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

// API Route to handle video uploads
app.post("/upload", upload.single("video"), async (req, res) => {
  const { userId, question } = req.body;
  const video = req.file;

  if (!video) {
    return res.status(400).send("No video file uploaded.");
  }

  const filePath = video.path;
  const fileName = video.originalname;

  try {
    // Upload file to Google Drive
    const driveFileId = await uploadFileToGoogleDrive(filePath, fileName);

    // Optionally save to database
    console.log("Video uploaded to Google Drive with ID:", driveFileId);

    res.status(200).send({
      message: "Video uploaded successfully!",
      fileId: driveFileId,
      question,
      userId,
    });

    // Delete the file locally after successful upload
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting local file:", err);
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