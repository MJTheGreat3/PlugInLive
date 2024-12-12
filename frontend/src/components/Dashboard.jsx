import { useState } from "react";
import { ReactMediaRecorder } from "react-media-recorder";
import axios from "axios";
import VideoPreview from "./VideoPreview.jsx";
import { useSession } from "./SessionContext.jsx";

const questions = [
  "Tell us about yourself?",
  "What’s your view on remote work culture?",
  "How do you stay updated with industry trends?",
  "What inspired you to choose your career path?",
];

function Dashboard() {
  const [recordings, setRecordings] = useState(Array(questions.length).fill(null));
  const [dimensions, setDimensions] = useState(
    Array(questions.length).fill({ width: 500, height: 500 })
  );
  const { session } = useSession();

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



  return session && (
    <div className="p-5 m-auto max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Video Interview</h1>
      {questions.map((question, index) => (
        <div key={index} className="mb-6">
          <h3 className="text-2xl font-semibold mb-4">{question}</h3>
          <ReactMediaRecorder
            video
            render={({ status, startRecording, stopRecording, mediaBlobUrl, previewStream }) => (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">Status: {status}</p>
                <div className="flex justify-center">
                  <VideoPreview stream={previewStream} />
                </div>
                <div className="flex justify-start space-x-4">
                  <button
                    onClick={startRecording}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Start Recording
                  </button>
                  <button
                    onClick={stopRecording}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Stop Recording
                  </button>
                </div>
                {mediaBlobUrl && (
                  <div className="mt-4">
                    <video
                      src={mediaBlobUrl}
                      controls
                      width={dimensions[index]?.width}
                      height={dimensions[index]?.height}
                      className="mx-auto"
                    />
                    <button
                      onClick={() =>
                        handleSaveRecording(index, mediaBlobUrl, dimensions[index])
                      }
                      className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
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
      <button
        onClick={handleSubmit}
        className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 mt-6"
      >
        Submit
      </button>
    </div>
  );
}
export default Dashboard;
