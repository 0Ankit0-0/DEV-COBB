const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const huggingFaceService = require("../services/huggingFace");

router.post("/chat", protect, async (req, res) => {
  try {
    const {
      message,
      fileId,
      code,
      projectId,
      language = "javascript",
    } = req.body;

    let prompt = `You are a helpful coding assistant. The user is working with ${language} code.`;

    if (code) {
      prompt += `\n\nHere is the user's code:\n\`\`\`${language}\n${code}\n\`\`\``;
    }

    prompt += `\n\nUser: ${message}\nAssistant:`;

    const aiResponse = await huggingFaceService.generateResponse(prompt);

    let responseCode = null;
    const codeBlockRegex = /```(?:[\w-]+)?\s*([\s\S]*?)```/g;
    const codeBlocks = [];
    let match;

    while ((match = codeBlockRegex.exec(aiResponse)) !== null) {
      codeBlocks.push(match[1].trim());
    }

    if (codeBlocks.length > 0) {
      responseCode = codeBlocks[0];
    }

    let cleanResponse = aiResponse;
    if (responseCode) {
      cleanResponse = aiResponse.replace(/```(?:[\w-]+)?\s*[\s\S]*?```/g, "");
    }

    res.json({
      message: cleanResponse.trim(),
      code: responseCode,
      language,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    res
      .status(500)
      .json({ error: error.message || "Error processing AI request" });
  }
});

router.post("/code-completion", protect, async (req, res) => {
  try {
    const { code, language, cursor } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Code is required" });
    }

    const completion = await huggingFaceService.generateCodeCompletion(
      code,
      language
    );

    res.json({
      completion,
      language,
    });
  } catch (error) {
    console.error("Code completion error:", error);
    res
      .status(500)
      .json({ error: error.message || "Error generating code completion" });
  }
});

router.post("/code-suggestions", protect, async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Code is required" });
    }

    const prompt = `Analyze this ${language} code and suggest improvements. Format your response as a JSON array of objects with 'title', 'description', and 'code' properties:
\`\`\`${language}
${code}
\`\`\``;

    const suggestionsResponse = await huggingFaceService.generateResponse(
      prompt
    );

    let suggestions = [];
    try {
      const jsonMatch = suggestionsResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        suggestions = generateLocalSuggestions(code, language);
      }
    } catch (err) {
      console.error("Error parsing AI suggestions:", err);
      suggestions = generateLocalSuggestions(code, language);
    }

    res.json({
      suggestions,
      language,
    });
  } catch (error) {
    console.error("Code suggestions error:", error);
    res
      .status(500)
      .json({ error: error.message || "Error generating code suggestions" });
  }
});

function generateLocalSuggestions(code, language) {
  const suggestions = [];

  if (language === "javascript" || language === "typescript") {
    if (code.includes("function") && !code.includes("async")) {
      suggestions.push({
        title: "Convert to async function",
        description: "Make this function asynchronous for better performance",
        code: code.replace(/function\s+(\w+)\s*\(/, "async function $1("),
      });
    }

    if (code.includes("console.log")) {
      suggestions.push({
        title: "Add error handling",
        description: "Wrap your code in try/catch for better error handling",
        code: `try {\n  ${code
          .split("\n")
          .join(
            "\n  "
          )}\n} catch (error) {\n  console.error("An error occurred:", error);\n}`,
      });
    }

    if (code.includes("fetch(") && !code.includes("try")) {
      suggestions.push({
        title: "Add fetch error handling",
        description: "Add proper error handling for fetch requests",
        code: code.replace(
          /fetch$$(.*?)$$/,
          `fetch($1)\n  .then(response => {\n    if (!response.ok) throw new Error('Network response was not ok');\n    return response.json();\n  })\n  .catch(error => console.error('Fetch error:', error))`
        ),
      });
    }
  } else if (language === "python") {
    if (code.includes("def ") && !code.includes('if __name__ == "__main__"')) {
      suggestions.push({
        title: "Add main function guard",
        description:
          'Add if __name__ == "__main__" guard for better module structure',
        code: `${code}\n\nif __name__ == "__main__":\n    # Call your main function here\n    pass`,
      });
    }

    if (code.includes("print(") && !code.includes("try:")) {
      suggestions.push({
        title: "Add error handling",
        description: "Wrap your code in try/except for better error handling",
        code: `try:\n    ${code
          .split("\n")
          .join(
            "\n    "
          )}\nexcept Exception as e:\n    print(f"An error occurred: {e}")`,
      });
    }
  } else if (language === "java") {
    if (code.includes("public static void main") && !code.includes("try")) {
      suggestions.push({
        title: "Add error handling",
        description: "Wrap your code in try-catch for better error handling",
        code: code.replace(
          /(public static void main.*?\{)([\s\S]*?)(\})/,
          '$1\n    try {\n$2\n    } catch (Exception e) {\n        System.err.println("An error occurred: " + e.getMessage());\n        e.printStackTrace();\n    }\n$3'
        ),
      });
    }
  }

  return suggestions;
}

module.exports = router;
