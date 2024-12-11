import React, { useState, useRef, useEffect } from "react";
import { ReactMediaRecorder } from "react-media-recorder";
import axios from "axios";

const VideoPreview = ({ stream }) => {
  const videoRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 500 });

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;

      // Adjust dimensions to match video resolution
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const { width, height } = videoTrack.getSettings();
        setDimensions({
          width: width || 500,
          height: height || 500,
        });
      }
    }
  }, [stream]);

  if (!stream) {
    return null;
  }

  return (
    <video
      ref={videoRef}
      width={dimensions.width}
      height={dimensions.height}
      style={{ objectFit: "cover" }}
      autoPlay
      controls
    />
  );
};

const questions = [
  "Tell us about yourself?",
  "What’s your view on remote work culture?",
  "How do you stay updated with industry trends?",
  "What inspired you to choose your career path?",
];

function App() {
  const [recordings, setRecordings] = useState(Array(questions.length).fill(null));
  const [dimensions, setDimensions] = useState(
    Array(questions.length).fill({ width: 500, height: 500 })
  );

  const handleSaveRecording = (index, url, dims) => {
    const blob = fetch(url).then((res) => res.blob());
    blob.then((data) => {
      const file = new File([data], `response_${index + 1}.webm`, { type: "video/webm" });
      setRecordings((prev) => {
        const updated = [...prev];
        updated[index] = file;
        return updated;
      });
      setDimensions((prev) => {
        const updated = [...prev];
        updated[index] = dims;
        return updated;
      });
    });
  };

  const handleSubmit = async () => {
    // Check if all questions have responses
    const allAnswered = recordings.every((recording) => recording !== null);
  
    if (!allAnswered) {
      alert("Please save a response for all questions before submitting.");
      return;
    }
  
    try {
      for (let i = 0; i < recordings.length; i++) {
        if (recordings[i]) {
          const formData = new FormData();
          formData.append("userId", "1"); // Default user ID
          formData.append("question", questions[i]);
          formData.append("video", recordings[i]); // video file
  
          // Send individual request for each video
          const response = await axios.post("http://localhost:3000/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
  
          console.log("Response for question", i + 1, ":", response.data);
        }
      }
      alert("Responses saved successfully!");
    } catch (error) {
      console.error("Error submitting responses:", error);
      alert("Failed to save responses. Please try again.");
    }
  };
  
  

  return (
    <div style={{ padding: "20px" }}>
      <h1>Video Interview</h1>
      {questions.map((question, index) => (
        <div key={index} style={{ marginBottom: "30px" }}>
          <h3>{question}</h3>
          <ReactMediaRecorder
            video
            render={({ status, startRecording, stopRecording, mediaBlobUrl, previewStream }) => (
              <div>
                <div>
                  <p>Status: {status}</p>
                </div>
                <div>
                  <VideoPreview stream={previewStream} />
                </div>
                <div>
                  <button onClick={startRecording} style={{ marginRight: "10px" }}>
                    Start Recording
                  </button>
                  <button onClick={stopRecording}>Stop Recording</button>
                </div>
                {mediaBlobUrl && (
                  <div>
                    <video
                      src={mediaBlobUrl}
                      controls
                      width={dimensions[index]?.width}
                      height={dimensions[index]?.height}
                      style={{ marginTop: "10px", display: "block" }}
                    />
                    <button
                      onClick={() =>
                        handleSaveRecording(index, mediaBlobUrl, dimensions[index])
                      }
                      style={{ marginTop: "10px" }}
                    >
                      Save Recording
                    </button>
                  </div>
                )}
              </div>
            )}
          />
        </div>
      ))}
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}

export default App;