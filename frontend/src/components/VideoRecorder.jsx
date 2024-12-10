// src/components/VideoRecorder.jsx
import React from 'react';
import { ReactMediaRecorder } from 'react-media-recorder';

const VideoRecorder = () => {
  const handleStopRecording = async (blobUrl, blob) => {
    try {
      const formData = new FormData();
      formData.append('video', blob, 'video.webm');

      // Send the video to the server
      const response = await fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        console.log('Video uploaded successfully');
      } else {
        console.error('Failed to upload video');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
    }
  };

  return (
    <div>
      <ReactMediaRecorder
        video
        onStop={handleStopRecording}
        render={({ startRecording, stopRecording, mediaBlobUrl }) => (
          <div>
            <button onClick={startRecording}>Start Recording</button>
            <button onClick={stopRecording}>Stop Recording</button>
            {mediaBlobUrl && <video src={mediaBlobUrl} controls autoPlay />}
          </div>
        )}
      />
    </div>
  );
};

export default VideoRecorder;
