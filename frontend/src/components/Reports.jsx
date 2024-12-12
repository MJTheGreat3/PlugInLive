import React from 'react';
import { useLocation } from 'react-router-dom';

const Reports = () => {
  const location = useLocation();
  const { reports } = location.state; // Extract the reports from the state
  console.log(location.state?.reports); // Should log the reports passed from the Dashboard

  console.log("hello world you reached the new page");
  return (
    <div>
      <h1>Transcription Reports</h1>
      <div>
        {reports.length === 0 ? (
          <p>No reports to display.</p>
        ) : (
          reports.map((report, index) => (
            <div key={index}>
              <h1 className="text-[30px] m-8">Report {index + 1}</h1>
              <pre>{report}</pre> {/* Display the text file content */}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reports;
