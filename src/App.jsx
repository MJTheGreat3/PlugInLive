import React, { useState } from 'react';
import axios from 'axios';
import { ReactMediaRecorder } from 'react-media-recorder';

const App = () => {
  const [texts, setTexts] = useState([""]); // Initialize with one text input
  const [recordedVideo, setRecordedVideo] = useState(null);

  const addTextInput = () => {
    setTexts([...texts, ""]);
  };

  const handleTextChange = (index, value) => {
    const updatedTexts = [...texts];
    updatedTexts[index] = value;
    setTexts(updatedTexts);
  };

  const handleSubmit = async () => {
    if (!recordedVideo) {
      alert("Please record a video before submitting.");
      return;
    }

    const formData = new FormData();
    formData.append("video", recordedVideo);
    formData.append("texts", JSON.stringify(texts)); // Send texts as a JSON array

    try {
      const response = await axios.post("http://localhost:3000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Upload successful!");
      console.log(response.data);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Check the console for details.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Video Recorder with Dynamic Text Inputs</h1>
      <div style={{ marginBottom: "20px" }}>
        <ReactMediaRecorder
          video
          render={({ status, startRecording, stopRecording, mediaBlobUrl }) => (
            <div>
              <p>Status: {status}</p>
              <button onClick={startRecording}>Start Recording</button>
              <button onClick={stopRecording}>Stop Recording</button>
              {mediaBlobUrl && (
                <div>
                  <video src={mediaBlobUrl} controls />
                  <button
                    onClick={async () => {
                      const blob = await fetch(mediaBlobUrl).then((r) => r.blob());
                      setRecordedVideo(blob);
                    }}
                  >
                    Save Video
                  </button>
                </div>
              )}
            </div>
          )}
        />
      </div>
      <div>
        <h3>Enter Texts</h3>
        {texts.map((text, index) => (
          <div key={index} style={{ display: "flex", marginBottom: "10px" }}>
            <input
              type="text"
              value={text}
              onChange={(e) => handleTextChange(index, e.target.value)}
              placeholder={`Text ${index + 1}`}
              style={{ flex: 1, marginRight: "10px" }}
            />
          </div>
        ))}
        <button onClick={addTextInput}>+ Add Text</button>
      </div>
      <button onClick={handleSubmit} style={{ marginTop: "20px" }}>
        Submit
      </button>
    </div>
  );
};

export default App;
