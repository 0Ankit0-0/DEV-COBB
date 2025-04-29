"use client";

import { useState, useEffect, useRef } from "react";
import "../styles/Terminal.css";

const Terminal = ({
  projectId,
  activeFile,
  fileContent,
  socket,
  output = [],
}) => {
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when output changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output, history]);

  // Focus input when terminal is clicked
  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle command execution
  const executeCommand = (e) => {
    e.preventDefault();

    if (!command.trim()) return;

    // Add command to history
    setHistory((prev) => [...prev, { type: "command", content: command }]);

    // Process command
    if (command.startsWith("run ")) {
      // Run code in a specific language
      const parts = command.split(" ");
      const language = parts[1];
      const code =
        parts.slice(2).join(" ") ||
        (activeFile && fileContent[activeFile._id]) ||
        "";

      if (socket) {
        socket.emit("terminal:execute", {
          projectId,
          language,
          code,
        });

        setHistory((prev) => [
          ...prev,
          { type: "info", content: `Running ${language} code...` },
          { type: "code", content: code, language },
        ]);
      } else {
        setHistory((prev) => [
          ...prev,
          { type: "error", content: "Socket connection not available" },
        ]);
      }
    } else if (command === "clear") {
      // Clear terminal
      setHistory([]);
    } else if (command === "help") {
      // Show help
      setHistory((prev) => [
        ...prev,
        {
          type: "info",
          content: `Available commands:
  - run <language> [code]: Run code in specified language
  - clear: Clear terminal
  - help: Show this help message`,
        },
      ]);
    } else {
      // Unknown command
      setHistory((prev) => [
        ...prev,
        { type: "error", content: `Command not found: ${command}` },
      ]);
    }

    // Reset command and history index
    setCommand("");
    setHistoryIndex(-1);
  };

  // Handle key navigation through history
  const handleKeyDown = (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (
        historyIndex <
        history.filter((item) => item.type === "command").length - 1
      ) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        const commandHistory = history.filter(
          (item) => item.type === "command"
        );
        setCommand(
          commandHistory[commandHistory.length - 1 - newIndex].content
        );
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        const commandHistory = history.filter(
          (item) => item.type === "command"
        );
        setCommand(
          commandHistory[commandHistory.length - 1 - newIndex].content
        );
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand("");
      }
    }
  };

  return (
    <div className="terminal" ref={terminalRef} onClick={focusInput}>
      <div className="terminal-output">
        <div className="terminal-welcome">
          <p>DEV-COBB Terminal v1.0.0</p>
          <p>Type 'help' for available commands</p>
        </div>

        {/* Command history */}
        {history.map((item, index) => (
          <div key={index} className={`terminal-line ${item.type}`}>
            {item.type === "command" ? (
              <>
                <span className="terminal-prompt">$</span> {item.content}
              </>
            ) : item.type === "code" ? (
              <pre className="terminal-code">
                <code>{item.content}</code>
              </pre>
            ) : (
              item.content
            )}
          </div>
        ))}

        {/* Output from code execution */}
        {output.map((item, index) => (
          <div key={`output-${index}`} className={`terminal-line ${item.type}`}>
            {item.content}
          </div>
        ))}

        {/* Command input */}
        <form onSubmit={executeCommand} className="terminal-input-line">
          <span className="terminal-prompt">$</span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            className="terminal-input"
            autoFocus
          />
        </form>
      </div>
    </div>
  );
};

export default Terminal;
