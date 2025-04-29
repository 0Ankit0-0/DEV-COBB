import { useState, useEffect } from "react";
import "../styles/CodeRunner.css";

const CodeRunner = ({ socket, activeFile, fileContent }) => {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [stdin, setStdin] = useState("");

  // Update code when active file changes
  useEffect(() => {
    if (activeFile && fileContent[activeFile._id]) {
      setCode(fileContent[activeFile._id]);

      // Try to detect language from file extension
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
      };

      if (languageMap[extension]) {
        setLanguage(languageMap[extension]);
      }
    }
  }, [activeFile, fileContent]);

  // Handle socket events for code execution
  useEffect(() => {
    if (!socket) return;

    const handleExecutionOutput = (data) => {
      setOutput((prev) => [...prev, { type: "output", content: data.output }]);
    };

    const handleExecutionError = (data) => {
      setOutput((prev) => [...prev, { type: "error", content: data.error }]);
      setIsRunning(false);
    };

    const handleExecutionDone = (data) => {
      setOutput((prev) => [
        ...prev,
        {
          type: "info",
          content: `Execution completed (Status: ${
            data.status || "Done"
          }, Time: ${data.time || "0.00"}s, Memory: ${data.memory || "0"}KB)`,
        },
      ]);
      setIsRunning(false);
    };

    socket.on("execution:output", handleExecutionOutput);
    socket.on("execution:error", handleExecutionError);
    socket.on("execution:done", handleExecutionDone);

    return () => {
      socket.off("execution:output", handleExecutionOutput);
      socket.off("execution:error", handleExecutionError);
      socket.off("execution:done", handleExecutionDone);
    };
  }, [socket]);

  const runCode = () => {
    if (!socket || !code.trim()) return;

    setIsRunning(true);
    setOutput([{ type: "info", content: `Running ${language} code...` }]);

    socket.emit("execution:run", {
      language,
      code,
      stdin,
    });
  };

  const clearOutput = () => {
    setOutput([]);
  };

  return (
    <div className="code-runner">
      <div className="code-runner-header">
        <div className="language-selector">
          <label htmlFor="language-select">Language:</label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={isRunning}
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
            <option value="csharp">C#</option>
            <option value="go">Go</option>
            <option value="ruby">Ruby</option>
            <option value="php">PHP</option>
          </select>
        </div>
        <div className="runner-actions">
          <button
            className="run-button"
            onClick={runCode}
            disabled={isRunning || !code.trim()}
          >
            {isRunning ? "Running..." : "Run"}
          </button>
          <button
            className="clear-button"
            onClick={clearOutput}
            disabled={isRunning || output.length === 0}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="code-runner-content">
        <div className="code-editor">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter your code here..."
            disabled={isRunning}
            spellCheck="false"
          ></textarea>
        </div>

        <div className="stdin-editor">
          <div className="stdin-header">
            <label htmlFor="stdin">Standard Input:</label>
          </div>
          <textarea
            id="stdin"
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Enter input for your program (optional)"
            disabled={isRunning}
            spellCheck="false"
          ></textarea>
        </div>

        <div className="output-viewer">
          <div className="output-header">
            <span>Output:</span>
          </div>
          <div className="output-content">
            {output.length === 0 ? (
              <div className="no-output">Run your code to see output here</div>
            ) : (
              output.map((item, index) => (
                <div key={index} className={`output-line ${item.type}`}>
                  {item.content}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeRunner;
