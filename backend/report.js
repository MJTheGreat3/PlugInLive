const fs = require('fs');
const fillerWords = [
  "um",
  "uh",
  "like",
  "basically",
  "actually",
  "literally",
  "so",
  "well",
  "yeah",
  "right",
  "ok",
  "hmm",
];

/**
 * Generate and save a transcription report.
 *
 * @param {Object} response - The transcription response object.
 * @param {Array} fillerWords - An array of filler words to check against.
 * @param {string} filePath - The file path where the report will be saved.
 */
function generateTranscriptionReport(response, filePath = 'report.txt') {
  let report = `
Transcription Report
=====================
ID: ${response.data.id}
Status: ${response.data.status}
Audio URL: ${response.data.audio_url}
Overall Confidence: ${(response.data.confidence * 100).toFixed(2)}%

Transcript:
-----------
${response.data.text}

Word-by-Word Details:
---------------------
`;

  let fillerCount = 0;
  let vocabulary = 0;
  let totalWords = 0;
  const wordsEncountered = [];

  response.data.words.forEach((word) => {
    totalWords++;
    if (fillerWords.includes(word.text.toLowerCase())) {
      fillerCount++;
    } else {
      if (!wordsEncountered.includes(word.text.toLowerCase())) {
        vocabulary++;
        wordsEncountered.push(word.text.toLowerCase());
      }
    }
  });

  report += `Filler Words: ${fillerCount}\nUnique Vocabulary: ${vocabulary}\nTotal Words: ${totalWords}\n\nDifferent Words:\n${wordsEncountered.join(', ')}`;

  fs.writeFile(filePath, report, (err) => {
    if (err) {
      console.error('Error writing file:', err);
    } else {
      console.log(`Report saved to "${filePath}"`);
    }
  });
}

module.exports = generateTranscriptionReport;