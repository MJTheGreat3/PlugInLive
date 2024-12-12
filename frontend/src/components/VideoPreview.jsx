import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";

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

// Corrected PropTypes definition
VideoPreview.propTypes = {
  stream: PropTypes.instanceOf(MediaStream), // Validate as MediaStream object
};

export default VideoPreview;
