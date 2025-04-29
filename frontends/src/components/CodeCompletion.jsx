"use client";

import { useState, useEffect } from "react";
import "../styles/CodeCompletion.css";

const CodeCompletion = ({ editorInstance, activeFile, fileContent }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!editorInstance || !activeFile) return;

    // Set up event listeners for editor
    const disposable = editorInstance.onKeyUp((e) => {
      // Trigger suggestions on dot, space, or specific characters
      if ([".", " ", "(", "{", "[", '"', "'"].includes(e.key)) {
        generateSuggestions();
      }
    });

    return () => {
      disposable.dispose();
    };
  }, [editorInstance, activeFile, fileContent]);

  const generateSuggestions = () => {
    if (!editorInstance || !activeFile) return;

    const model = editorInstance.getModel();
    const position = editorInstance.getPosition();

    if (!model || !position) return;

    // Get current line and text before cursor
    const lineContent = model.getLineContent(position.lineNumber);
    const textBeforeCursor = lineContent.substring(0, position.column - 1);

    // Simple suggestion logic based on context
    let newSuggestions = [];

    // If typing after a dot (e.g., object.m)
    if (textBeforeCursor.endsWith(".")) {
      const objectName = textBeforeCursor.split(".").slice(-2, -1)[0];

      if (objectName) {
        // Common methods based on object name
        if (
          objectName.toLowerCase().includes("array") ||
          objectName.match(/s$/i)
        ) {
          newSuggestions = [
            {
              label: "map",
              detail: "(callback) => Array",
              insertText: "map((item) => {\n\treturn item;\n})",
            },
            {
              label: "filter",
              detail: "(callback) => Array",
              insertText: "filter((item) => {\n\treturn true;\n})",
            },
            {
              label: "forEach",
              detail: "(callback) => void",
              insertText: "forEach((item) => {\n\t\n})",
            },
            {
              label: "reduce",
              detail: "(callback, initialValue) => any",
              insertText:
                "reduce((acc, item) => {\n\treturn acc;\n}, initialValue)",
            },
            { label: "length", detail: "number", insertText: "length" },
          ];
        } else if (objectName.toLowerCase().includes("string")) {
          newSuggestions = [
            {
              label: "substring",
              detail: "(start, end?) => string",
              insertText: "substring(0)",
            },
            {
              label: "replace",
              detail: "(pattern, replacement) => string",
              insertText: "replace(pattern, replacement)",
            },
            {
              label: "toUpperCase",
              detail: "() => string",
              insertText: "toUpperCase()",
            },
            {
              label: "toLowerCase",
              detail: "() => string",
              insertText: "toLowerCase()",
            },
            { label: "length", detail: "number", insertText: "length" },
          ];
        } else {
          // Generic suggestions
          newSuggestions = [
            {
              label: "toString",
              detail: "() => string",
              insertText: "toString()",
            },
            { label: "valueOf", detail: "() => any", insertText: "valueOf()" },
          ];
        }
      }
    } else {
      // Context-aware keyword suggestions
      const fileExtension = activeFile.name.split(".").pop().toLowerCase();

      if (fileExtension === "js" || fileExtension === "jsx") {
        newSuggestions = [
          {
            label: "function",
            detail: "function declaration",
            insertText: "function name() {\n\t\n}",
          },
          {
            label: "const",
            detail: "constant declaration",
            insertText: "const name = value;",
          },
          {
            label: "let",
            detail: "variable declaration",
            insertText: "let name = value;",
          },
          {
            label: "if",
            detail: "if statement",
            insertText: "if (condition) {\n\t\n}",
          },
          {
            label: "for",
            detail: "for loop",
            insertText: "for (let i = 0; i < array.length; i++) {\n\t\n}",
          },
          {
            label: "console.log",
            detail: "log to console",
            insertText: "console.log();",
          },
        ];
      } else if (fileExtension === "py") {
        newSuggestions = [
          {
            label: "def",
            detail: "function definition",
            insertText: "def function_name():\n\tpass",
          },
          {
            label: "if",
            detail: "if statement",
            insertText: "if condition:\n\tpass",
          },
          {
            label: "for",
            detail: "for loop",
            insertText: "for item in iterable:\n\tpass",
          },
          {
            label: "class",
            detail: "class definition",
            insertText: "class ClassName:\n\tdef __init__(self):\n\t\tpass",
          },
          {
            label: "import",
            detail: "import statement",
            insertText: "import module",
          },
          { label: "print", detail: "print to console", insertText: "print()" },
        ];
      }
    }

    if (newSuggestions.length > 0) {
      setSuggestions(newSuggestions);
      setSelectedIndex(0);
      setIsVisible(true);

      // Get cursor position for suggestion box
      const cursorCoords = editorInstance.getScrolledVisiblePosition(
        editorInstance.getPosition()
      );
      const editorDomNode = editorInstance.getDomNode();

      if (cursorCoords && editorDomNode) {
        setPosition({
          x: cursorCoords.left,
          y: cursorCoords.top + 20, // Position below cursor
        });
      }
    } else {
      setIsVisible(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (!editorInstance) return;

    const position = editorInstance.getPosition();
    if (!position) return;

    // Insert the suggestion text at cursor position
    editorInstance.executeEdits("suggestion", [
      {
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        },
        text: suggestion.insertText,
      },
    ]);

    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      className="code-completion"
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <ul className="suggestion-list">
        {suggestions.map((suggestion, index) => (
          <li
            key={index}
            className={`suggestion-item ${
              index === selectedIndex ? "selected" : ""
            }`}
            onClick={() => handleSuggestionClick(suggestion)}
          >
            <span className="suggestion-label">{suggestion.label}</span>
            <span className="suggestion-detail">{suggestion.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CodeCompletion;
