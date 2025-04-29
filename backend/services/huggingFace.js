const axios = require("axios");

class HuggingFaceService {
  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY;
    this.apiUrl =
      process.env.HUGGINGFACE_API_URL ||
      "https://api-inference.huggingface.co/models";
    this.model =
      process.env.HUGGINGFACE_MODEL || "mistralai/Mistral-7B-Instruct-v0.2";
    this.codeModel = process.env.HUGGINGFACE_CODE_MODEL || "bigcode/starcoder";
  }

  async generateResponse(prompt) {
    try {
      if (!this.apiKey) {
        return this.generateFallbackResponse(prompt);
      }

      const response = await axios.post(
        `${this.apiUrl}/${this.model}`,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: 1024,
            temperature: 0.7,
            top_p: 0.95,
            do_sample: true,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (
        response.data &&
        response.data[0] &&
        response.data[0].generated_text
      ) {
        return response.data[0].generated_text.replace(prompt, "").trim();
      }

      return this.generateFallbackResponse(prompt);
    } catch (error) {
      console.error("Error generating response from Hugging Face:", error);
      return this.generateFallbackResponse(prompt);
    }
  }

  async generateCodeCompletion(code, language) {
    try {
      if (!this.apiKey) {
        return this.generateFallbackCodeCompletion(code, language);
      }

      const response = await axios.post(
        `${this.apiUrl}/${this.codeModel}`,
        {
          inputs: code,
          parameters: {
            max_new_tokens: 256,
            temperature: 0.2,
            top_p: 0.95,
            do_sample: true,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (
        response.data &&
        response.data[0] &&
        response.data[0].generated_text
      ) {
        return response.data[0].generated_text.replace(code, "").trim();
      }

      return this.generateFallbackCodeCompletion(code, language);
    } catch (error) {
      console.error(
        "Error generating code completion from Hugging Face:",
        error
      );
      return this.generateFallbackCodeCompletion(code, language);
    }
  }

  generateFallbackResponse(prompt) {
    // Simple fallback when API is not available
    if (prompt.includes("help") || prompt.includes("how to")) {
      return "I'm currently operating in offline mode. For specific help, please try again when the connection is restored.";
    } else if (prompt.includes("error") || prompt.includes("bug")) {
      return "I notice you're asking about an error or bug. While I'm offline, here are some general debugging tips:\n\n1. Check for syntax errors\n2. Verify all variables are properly defined\n3. Use console.log() or print statements to trace execution\n4. Check your function parameters and return values";
    }

    return "I'm currently operating with limited functionality due to connection issues. I'll try to assist you as best I can.";
  }

  generateFallbackCodeCompletion(code, language) {
    // Simple fallback code completion
    const completions = {
      javascript: {
        "function ":
          "function myFunction() {\n  // TODO: Implement function\n  return null;\n}",
        "const ": "const myVariable = {\n  key: 'value',\n  number: 42\n};",
        "if (": "if (condition) {\n  // TODO: Implement if block\n}",
        "for (":
          "for (let i = 0; i < array.length; i++) {\n  const item = array[i];\n  // TODO: Process item\n}",
      },
      python: {
        "def ":
          "def my_function():\n    # TODO: Implement function\n    return None",
        "if ": "if condition:\n    # TODO: Implement if block\n    pass",
        "for ": "for item in items:\n    # TODO: Process item\n    pass",
        "class ":
          "class MyClass:\n    def __init__(self):\n        # Initialize\n        pass\n    \n    def my_method(self):\n        # TODO: Implement method\n        pass",
      },
      java: {
        "public class ":
          "public class MyClass {\n    public static void main(String[] args) {\n        // TODO: Implement main method\n    }\n}",
        "public void ":
          "public void myMethod() {\n    // TODO: Implement method\n}",
        "if (": "if (condition) {\n    // TODO: Implement if block\n}",
        "for (":
          "for (int i = 0; i < array.length; i++) {\n    // TODO: Process item\n}",
      },
    };

    const langCompletions = completions[language] || completions.javascript;

    // Find the best match for the current code
    for (const prefix in langCompletions) {
      if (code.trim().endsWith(prefix)) {
        return langCompletions[prefix];
      }
    }

    // Default completion
    return "// No completion available in offline mode";
  }
}

module.exports = new HuggingFaceService();
