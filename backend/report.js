const fs = require("fs");
const axios = require("axios");


//^ lt api
const language = "en"; // Language code for English

async function checkSyntaxAndGrammar(text) {
  try {
    const response = await axios.post(
      "https://api.languagetoolplus.com/v2/check",
      new URLSearchParams({
        text: text,
        language: language,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // Filter matches to exclude spelling-related issues
    const matches = response.data.matches.filter(
      (match) => match.rule.category.id !== "TYPOS" // Exclude typos/spelling issues
    );

    console.log("Grammar/Syntax Issues Found:", matches.length);

    matches.forEach((match, index) => {
      console.log(`Issue ${index + 1}:`);
      console.log(`- Message: ${match.message}`);
      console.log(
        `- Suggestion: ${match.replacements.map((r) => r.value).join(", ")}`
      );
      console.log(`- Context: ${match.context.text}`);
    });

    return matches.length; // Return the count of grammar/syntax issues
  } catch (error) {
    console.error("Error checking grammar/syntax:", error);
  }
}

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
 * Generate and save a transcription report, including LT API results.
 *
 * @param {Object} response - The transcription response object.
 * @param {Array} fillerWords - An array of filler words to check against.
 * @param {string} filePath - The file path where the report will be saved.
 */
async function generateTranscriptionReport(response, filePath = "report.txt") {
  let report = `
Transcription Report
=====================
ID: ${response.id}
Status: ${response.status}
Audio URL: ${response.audio_url}
Overall Confidence: ${(response.confidence * 100).toFixed(2)}%

Transcript:
-----------
${response.text}

Word-by-Word Details:
---------------------
`;

  let fillerCount = 0;
  let vocabulary = 0;
  let totalWords = 0;
  const wordsEncountered = [];

  response.words.forEach((word) => {
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

  report += `Filler Words: ${fillerCount}\nUnique Vocabulary: ${vocabulary}\nTotal Words: ${totalWords}\n\nDifferent Words:\n${wordsEncountered.join(
    ", "
  )}\n`;

  // Call the LT API to check grammar and syntax
  const grammarIssues = await checkSyntaxAndGrammar(response.text);

  if (grammarIssues.length > 0) {
    report += `\nGrammar/Syntax Issues Found: ${grammarIssues.length}\n\n`;
    grammarIssues.forEach((issue, index) => {
      report += `
Issue ${index + 1}:
- Message: ${issue.message}
- Suggestion: ${issue.replacements.map((r) => r.value).join(", ")}
- Context: ${issue.context.text}
`;
    });
  } else {
    report += `\nNo Grammar/Syntax Issues Found.\n`;
  }

  try {
    // Write the report synchronously
    fs.writeFileSync(filePath, report);
    console.log(`Report saved to "${filePath}"`);
  } catch (err) {
    console.error("Error writing file:", err);
  }
  return {};
}
module.exports = generateTranscriptionReport;
