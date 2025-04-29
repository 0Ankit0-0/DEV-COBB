import { useState, useRef, useEffect } from "react";
import api from "../services/api";
import "../styles/AIAssistant.css";

const AIAssistant = ({
  projectId,
  activeFile,
  fileContent,
  editorInstance,
}) => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I'm your AI coding assistant. How can I help you with your code today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("auto");
  const [suggestions, setSuggestions] = useState([]);
  const [autoSuggestEnabled, setAutoSuggestEnabled] = useState(true);
  const [lastAnalyzedCode, setLastAnalyzedCode] = useState("");
  const [connectionError, setConnectionError] = useState(false);
  const messagesEndRef = useRef(null);
  const suggestionsTimeoutRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-detect language from active file
  useEffect(() => {
    if (activeFile) {
      const extension = activeFile.name.split(".").pop().toLowerCase();
      const languageMap = {
        js: "javascript",
        jsx: "javascript",
        ts: "typescript",
        tsx: "typescript",
        py: "python",
        java: "java",
        cpp: "cpp",
        c: "c",
        cs: "csharp",
        go: "go",
        rb: "ruby",
        php: "php",
        html: "html",
        css: "css",
        json: "json",
      };

      if (languageMap[extension]) {
        setSelectedLanguage(languageMap[extension]);
      }
    }
  }, [activeFile]);

  // Auto-suggest code completions when code changes
  useEffect(() => {
    if (!autoSuggestEnabled || !activeFile || !fileContent[activeFile._id])
      return;

    const currentCode = fileContent[activeFile._id];

    // Don't analyze if code hasn't changed significantly
    if (currentCode === lastAnalyzedCode) return;

    // Debounce code analysis
    if (suggestionsTimeoutRef.current) {
      clearTimeout(suggestionsTimeoutRef.current);
    }

    suggestionsTimeoutRef.current = setTimeout(() => {
      analyzeCodeForSuggestions(currentCode);
      setLastAnalyzedCode(currentCode);
    }, 2000); // Wait 2 seconds after typing stops

    return () => {
      if (suggestionsTimeoutRef.current) {
        clearTimeout(suggestionsTimeoutRef.current);
      }
    };
  }, [activeFile, fileContent, autoSuggestEnabled, lastAnalyzedCode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const analyzeCodeForSuggestions = async (code) => {
    if (!code || code.trim().length < 10) return;

    try {
      // Call the backend API for code suggestions
      const response = await api
        .post("/ai/code-suggestions", {
          code,
          language: selectedLanguage,
        })
        .catch((err) => {
          console.log("Error getting code suggestions:", err);
          return {
            data: {
              suggestions: generateLocalSuggestions(code, selectedLanguage),
            },
          };
        });

      // If we got a response from the API, use those suggestions
      if (response && response.data && response.data.suggestions) {
        setSuggestions(response.data.suggestions);
      } else {
        // Otherwise, generate local suggestions
        const localSuggestions = generateLocalSuggestions(
          code,
          selectedLanguage
        );
        setSuggestions(localSuggestions);
      }

      // If we have meaningful suggestions, add a subtle hint
      if (suggestions.length > 0) {
        // Only add a suggestion message if we don't already have one as the last message
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role !== "assistant" || !lastMessage.isSuggestion) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                "I noticed you're working on some code. I have some suggestions that might help.",
              isSuggestion: true,
              subtle: true,
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error analyzing code:", error);
      // Generate local suggestions as fallback
      const localSuggestions = generateLocalSuggestions(code, selectedLanguage);
      setSuggestions(localSuggestions);
    }
  };

  const generateLocalSuggestions = (code, language) => {
    // This is a simplified simulation of code suggestions
    // In a real implementation, this would use an AI model
    const suggestions = [];

    if (language === "javascript" || language === "typescript") {
      // Check for common patterns
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
      if (
        code.includes("def ") &&
        !code.includes('if __name__ == "__main__"')
      ) {
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsRunning(true);
    setConnectionError(false);

    try {
      // Get current file content if available
      let currentCode = "";
      let language = selectedLanguage;

      if (activeFile && fileContent[activeFile._id]) {
        currentCode = fileContent[activeFile._id];

        // If language is set to auto, try to detect from file extension
        if (language === "auto" && activeFile.name) {
          const extension = activeFile.name.split(".").pop().toLowerCase();
          const languageMap = {
            js: "javascript",
            jsx: "javascript",
            ts: "typescript",
            tsx: "typescript",
            py: "python",
            java: "java",
            cpp: "cpp",
            c: "c",
            cs: "csharp",
            go: "go",
            rb: "ruby",
            php: "php",
            html: "html",
            css: "css",
            json: "json",
          };

          language = languageMap[extension] || "javascript";
        }
      }

      // Try to get a response from the backend
      try {
        const response = await api
          .post("/ai/chat", {
            projectId,
            message: input,
            fileId: activeFile?._id,
            code: currentCode,
            language: language,
          })
          .catch((err) => {
            console.log("Error sending message to AI:", err);
            throw err;
          });

        if (response && response.data) {
          const assistantMessage = {
            role: "assistant",
            content:
              response.data.message ||
              "I understand your question. Let me help you with that.",
            code: response.data.code,
            language: response.data.language || language,
          };

          setMessages((prev) => [...prev, assistantMessage]);

          // If the AI provided code and we have an active file and editor instance
          if (response.data.code && activeFile && editorInstance) {
            // Ask user if they want to apply the code
            const shouldApplyCode = window.confirm(
              "Would you like to apply the suggested code to your file?"
            );

            if (shouldApplyCode) {
              // Apply the code to the editor
              editorInstance.setValue(response.data.code);
            }
          }
        } else {
          throw new Error("Invalid response from AI service");
        }
      } catch (err) {
        console.error("Error sending message to AI:", err);

        // Fallback to local response generation if backend fails
        const fallbackResponse = generateFallbackResponse(
          input,
          currentCode,
          language
        );

        setMessages((prev) => [...prev, fallbackResponse]);
        setConnectionError(true);
      }
    } catch (err) {
      console.error("Error in AI assistant:", err);

      const errorMessage = {
        role: "assistant",
        content:
          "Sorry, I encountered an error processing your request. Please try again later.",
        error: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsRunning(false);
    }
  };

  // Generate a fallback response when the backend is unavailable
  const generateFallbackResponse = (userInput, code, language) => {
    // Simple fallback responses based on keywords in the user input
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes("help") || lowerInput.includes("how to")) {
      return {
        role: "assistant",
        content:
          "I'm currently operating in offline mode due to connection issues. For specific help, please try again when the connection is restored. In the meantime, you can check the documentation for " +
          language +
          " or try searching online resources.",
      };
    } else if (
      lowerInput.includes("error") ||
      lowerInput.includes("bug") ||
      lowerInput.includes("fix")
    ) {
      return {
        role: "assistant",
        content:
          "I notice you're asking about an error or bug. While I'm offline, here are some general debugging tips:\n\n1. Check for syntax errors\n2. Verify all variables are properly defined\n3. Use console.log() or print statements to trace execution\n4. Check your function parameters and return values",
      };
    } else if (
      lowerInput.includes("example") ||
      lowerInput.includes("sample")
    ) {
      let exampleCode = "";

      switch (language) {
        case "javascript":
          exampleCode =
            "function greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet('World'));";
          break;
        case "python":
          exampleCode =
            "def greet(name):\n    return f\"Hello, {name}!\"\n\nprint(greet('World'))";
          break;
        case "java":
          exampleCode =
            'public class Greeting {\n    public static void main(String[] args) {\n        System.out.println(greet("World"));\n    }\n    \n    public static String greet(String name) {\n        return "Hello, " + name + "!";\n    }\n}';
          break;
        default:
          exampleCode = "// Example code for " + language;
      }

      return {
        role: "assistant",
        content: "Here's a simple example in " + language + ":",
        code: exampleCode,
        language: language,
      };
    }

    // Default fallback response
    return {
      role: "assistant",
      content:
        "I'm currently operating with limited functionality due to connection issues. I'll try to assist you as best I can. Could you try again with a more specific question?",
    };
  };

  const applySuggestion = (suggestionCode) => {
    if (editorInstance && activeFile) {
      editorInstance.setValue(suggestionCode);
      setSuggestions([]); // Clear suggestions after applying
    }
  };

  const formatMessage = (content) => {
    // Simple markdown-like formatting
    return content.split("\n").map((line, i) => {
      // Code blocks
      if (line.startsWith("```")) {
        return (
          <pre key={i} className="code-block">
            {line.replace(/```/g, "")}
          </pre>
        );
      }
      // Bold
      line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      // Italic
      line = line.replace(/\*(.*?)\*/g, "<em>$1</em>");

      return <p key={i} dangerouslySetInnerHTML={{ __html: line }} />;
    });
  };

  // Added this state variable
  const [isRunning, setIsRunning] = useState(false);

  return (
    <div className="ai-assistant">
      <div className="ai-assistant-header">
        <div className="language-selector">
          <label htmlFor="language-select">Language:</label>
          <select
            id="language-select"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
          >
            <option value="auto">Auto-detect</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
            <option value="csharp">C#</option>
            <option value="go">Go</option>
            <option value="ruby">Ruby</option>
            <option value="php">PHP</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="sql">SQL</option>
          </select>
        </div>
        <div className="auto-suggest-toggle">
          <label>
            <input
              type="checkbox"
              checked={autoSuggestEnabled}
              onChange={() => setAutoSuggestEnabled(!autoSuggestEnabled)}
            />
            Auto-suggest
          </label>
        </div>
      </div>

      {connectionError && (
        <div className="connection-error-banner">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>
            Connection to AI service unavailable. Operating in limited mode.
          </span>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="code-suggestions-panel">
          <h3>Suggestions</h3>
          <div className="suggestions-list">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="suggestion-item">
                <div className="suggestion-header">
                  <h4>{suggestion.title}</h4>
                  <button
                    className="apply-button"
                    onClick={() => applySuggestion(suggestion.code)}
                  >
                    Apply
                  </button>
                </div>
                <p>{suggestion.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.role} ${
              message.error ? "error" : ""
            } ${message.subtle ? "subtle" : ""}`}
          >
            <div className="message-avatar">
              {message.role === "assistant" ? "AI" : "You"}
            </div>
            <div className="message-content">
              {formatMessage(message.content)}
              {message.code && (
                <div className="code-suggestion">
                  <div className="code-header">
                    <span>Suggested Code ({message.language || "code"})</span>
                    <div className="code-actions">
                      <button
                        className="copy-button"
                        onClick={() => {
                          navigator.clipboard.writeText(message.code);
                          alert("Code copied to clipboard!");
                        }}
                      >
                        Copy
                      </button>
                      <button
                        className="apply-button"
                        onClick={() => {
                          if (editorInstance) {
                            editorInstance.setValue(message.code);
                          }
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                  <pre className="code-block">{message.code}</pre>
                </div>
              )}
            </div>
          </div>
        ))}
        {isRunning && (
          <div className="message assistant loading">
            <div className="message-avatar">AI</div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your code..."
          disabled={isRunning}
        />
        <button
          type="submit"
          className="send-button"
          disabled={isRunning || !input.trim()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  );
};

export default AIAssistant;
