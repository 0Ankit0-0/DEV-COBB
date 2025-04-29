const axios = require("axios");

const JUDGE0_API_URL = process.env.JUDGE0_API_URL || "https://judge0-ce.p.rapidapi.com";
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;
const JUDGE0_API_HOST = process.env.JUDGE0_API_HOST || "judge0-ce.p.rapidapi.com";

const LANGUAGE_IDS = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
  csharp: 51,
  php: 68,
  ruby: 72,
  go: 60,
  rust: 73,
  swift: 83,
  kotlin: 78,
};

const submitCode = async (sourceCode, language, stdin = "") => {
  try {
    if (!JUDGE0_API_KEY) {
      console.warn("JUDGE0_API_KEY not provided. Using simulated execution.");
      return simulateExecution(sourceCode, language, stdin);
    }

    const languageId = LANGUAGE_IDS[language.toLowerCase()];
    if (!languageId) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const options = {
      method: "POST",
      url: `${JUDGE0_API_URL}/submissions`,
      params: { base64_encoded: "false", fields: "*" },
      headers: {
        "content-type": "application/json",
        "X-RapidAPI-Key": JUDGE0_API_KEY,
        "X-RapidAPI-Host": JUDGE0_API_HOST,
      },
      data: {
        source_code: sourceCode,
        language_id: languageId,
        stdin: stdin,
        redirect_stderr_to_stdout: true,
      },
    };

    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error("Error submitting code to Judge0:", error);
    throw error;
  }
};

const getSubmissionResult = async (token) => {
  try {
    if (!JUDGE0_API_KEY) {
      return {
        status: { description: "Accepted" },
        stdout: "Simulated execution output",
        time: "0.01",
        memory: 9000,
      };
    }

    const options = {
      method: "GET",
      url: `${JUDGE0_API_URL}/submissions/${token}`,
      params: { base64_encoded: "false", fields: "*" },
      headers: {
        "X-RapidAPI-Key": JUDGE0_API_KEY,
        "X-RapidAPI-Host": JUDGE0_API_HOST,
      },
    };

    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error("Error getting submission result from Judge0:", error);
    throw error;
  }
};

const simulateExecution = async (sourceCode, language, stdin) => {
  return { token: `simulated-${language}-${Date.now()}` };
};

const getSimulatedResult = (token, sourceCode) => {
  const language = token.split("-")[1];
  let output = "";

  switch (language) {
    case "javascript":
      output =
        'console.log("Hello from JavaScript!");\n' +
        "Hello from JavaScript!\n" +
        'console.log("Sum of 5 and 3 is " + (5 + 3));\n' +
        "Sum of 5 and 3 is 8";
      break;
    case "python":
      output =
        'print("Hello from Python!")\n' +
        "Hello from Python!\n" +
        'print(f"Sum of 5 and 3 is {5 + 3}")\n' +
        "Sum of 5 and 3 is 8";
      break;
    case "java":
      output =
        "public class Main {\n" +
        "    public static void main(String[] args) {\n" +
        '        System.out.println("Hello from Java!");\n' +
        '        System.out.println("Sum of 5 and 3 is " + (5 + 3));\n' +
        "    }\n" +
        "}\n" +
        "Hello from Java!\n" +
        "Sum of 5 and 3 is 8";
      break;
    default:
      output = `Hello from ${language}!\nSimulated output for ${language} code execution.`;
  }

  return {
    status: { id: 3, description: "Accepted" },
    stdout: output,
    time: "0.01",
    memory: 9000,
  };
};

module.exports = {
  submitCode,
  getSubmissionResult,
  getSimulatedResult,
  LANGUAGE_IDS,
};
