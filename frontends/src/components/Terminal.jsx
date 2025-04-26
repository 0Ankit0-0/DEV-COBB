import { useRef, useEffect, useState } from "react";
import "../styles/Terminal.css";

const Terminal = ({ output = [] }) => {
  const terminalRef = useRef(null);
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [terminalPrompt, setTerminalPrompt] = useState("dev-cobb$ ");
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef(null);

  const displayOutput = [...output, ...history];

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }

    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [displayOutput]);

  const handleCommandSubmit = (e) => {
    e.preventDefault();

    if (!command.trim()) return;

    const newHistoryItem = {
      type: "command",
      content: `${terminalPrompt}${command}`,
    };

    setHistory((prev) => [...prev, newHistoryItem]);

    processCommand(command);

    setCommand("");
    setHistoryIndex(-1);
  };

  const processCommand = (cmd) => {
    const cmdLower = cmd.trim().toLowerCase();
    setIsProcessing(true);

    setTimeout(() => {
      let response;

      if (
        cmdLower.startsWith("npm install") ||
        cmdLower.startsWith("yarn add")
      ) {
        const packageName = cmdLower.split(" ")[2];
        response = {
          type: "output",
          content: packageName
            ? `Installing ${packageName}...\n` +
              `+ ${packageName}@1.0.0\n` +
              `added 1 package, and audited 42 packages in 2.5s\n` +
              `found 0 vulnerabilities`
            : `Please specify a package to install`,
        };
      } else if (
        cmdLower.startsWith("npm run") ||
        cmdLower.startsWith("yarn")
      ) {
        const scriptName = cmdLower.split(" ")[2] || "start";
        response = {
          type: "output",
          content:
            `> dev-cobb@1.0.0 ${scriptName}\n` +
            `> Running "${scriptName}" script...\n` +
            `Server started on port 3000\n` +
            `Ready in 2.4s`,
        };
      } else if (cmdLower === "clear" || cmdLower === "cls") {
        setHistory([]);
        setIsProcessing(false);
        return;
      } else if (cmdLower === "help") {
        response = {
          type: "info",
          content:
            `Available commands:\n` +
            `- npm install <package> - Install a package\n` +
            `- npm run <script> - Run a script\n` +
            `- yarn add <package> - Install a package with yarn\n` +
            `- yarn <script> - Run a script with yarn\n` +
            `- clear - Clear the terminal\n` +
            `- cd <directory> - Change directory\n` +
            `- ls - List files\n` +
            `- pwd - Print working directory\n` +
            `- help - Show this help message`,
        };
      } else if (cmdLower.startsWith("cd ")) {
        const dir = cmd.substring(3);
        setTerminalPrompt(`dev-cobb:${dir}$ `);
        response = {
          type: "info",
          content: `Changed directory to ${dir}`,
        };
      } else if (cmdLower === "ls" || cmdLower === "dir") {
        response = {
          type: "output",
          content: `src/\nnode_modules/\npackage.json\nREADME.md\n.gitignore`,
        };
      } else if (cmdLower === "pwd") {
        response = {
          type: "output",
          content: `/home/user/dev-cobb`,
        };
      } else {
        response = {
          type: "error",
          content: `Command not found: ${cmd}. Type 'help' for available commands.`,
        };
      }

      setHistory((prev) => [...prev, response]);
      setIsProcessing(false);
    }, 500);
  };

  const handleKeyDown = (e) => {
    // Handle up/down arrow keys for command history
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0) {
        // Find previous command (not output)
        let index = historyIndex;
        const commandHistory = history.filter(
          (item) => item.type === "command"
        );

        if (index < commandHistory.length - 1) {
          index += 1;
          setHistoryIndex(index);
          const previousCommand =
            commandHistory[commandHistory.length - 1 - index].content;
          setCommand(previousCommand.substring(terminalPrompt.length));
        }
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const commandHistory = history.filter(
          (item) => item.type === "command"
        );
        const index = historyIndex - 1;
        setHistoryIndex(index);
        const nextCommand =
          commandHistory[commandHistory.length - 1 - index].content;
        setCommand(nextCommand.substring(terminalPrompt.length));
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand("");
      }
    }
  };

  return (
    <div
      className="terminal"
      ref={terminalRef}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="terminal-content">
        {displayOutput.length === 0 ? (
          <div className="terminal-welcome">
            <p>Terminal ready</p>
            <p>Type 'help' for available commands</p>
          </div>
        ) : (
          displayOutput.map((item, index) => (
            <div key={index} className={`terminal-line ${item.type}`}>
              {item.type === "info" && (
                <span className="terminal-prefix info">INFO</span>
              )}
              {item.type === "error" && (
                <span className="terminal-prefix error">ERROR</span>
              )}
              {item.type === "output" && (
                <span className="terminal-prefix output">OUT</span>
              )}
              <span className="terminal-text">{item.content}</span>
            </div>
          ))
        )}
      </div>

      <form className="terminal-input-form" onSubmit={handleCommandSubmit}>
        <span className="terminal-prompt">{terminalPrompt}</span>
        <input
          ref={inputRef}
          type="text"
          className="terminal-input"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
          autoFocus
        />
      </form>
    </div>
  );
};

export default Terminal;
