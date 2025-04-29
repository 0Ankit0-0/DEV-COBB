import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProject } from "../contexts/ProjectContext";
import { useSocket } from "../contexts/SocketContext";
import { useAuth } from "../contexts/AuthContext";
import { MdOutlineHome } from "react-icons/md";
import { useTheme } from "../contexts/ThemeContext";
import MonacoEditor from "@monaco-editor/react";
import FileExplorer from "../components/FileExplorer";
import EditorTabs from "../components/EditorTabs";
import Terminal from "../components/Terminal";
import AIAssistant from "../components/AIAssistant";
import LivePreview from "../components/LivePreview";
import Toolbar from "../components/Toolbar";
import Collaborators from "../components/Collaborators";
import CodeRunner from "../components/CodeRunner";
import ErrorBoundary from "../components/ErrorBoundary";
import "../styles/Editor.css";

const Editor = () => {
  // Get data from contexts and params
  const { projectId } = useParams();
  const {
    project,
    files,
    activeFile,
    openedFiles,
    fileContent,
    loading,
    error,
    updateFileContent,
    setActiveFile,
    closeFile,
  } = useProject();
  const { socket, connected, collaborators } = useSocket();
  const { currentUser } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  // Component state
  const [editorLayout, setEditorLayout] = useState("default"); // default, preview, terminal, ai
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [editorInstance, setEditorInstance] = useState(null);
  const [editorTheme, setEditorTheme] = useState(darkMode ? "vs-dark" : "vs");
  const [activeTerminalTab, setActiveTerminalTab] = useState("terminal"); // terminal, runner
  const [cssLinks, setCssLinks] = useState({}); // Track CSS files linked to HTML files

  // Refs
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  const tohome = () => navigate("/dashboard");
  // Update editor theme when app theme changes
  useEffect(() => {
    setEditorTheme(darkMode ? "vs-dark" : "vs");
  }, [darkMode]);

  const navigate = useNavigate();

  // Handle editor layout changes
  useEffect(() => {
    if (showLivePreview && showTerminal) {
      setEditorLayout("both");
    } else if (showLivePreview) {
      setEditorLayout("preview");
    } else if (showTerminal) {
      setEditorLayout("terminal");
    } else if (showAIAssistant) {
      setEditorLayout("ai");
    } else {
      setEditorLayout("default");
    }
  }, [showLivePreview, showTerminal, showAIAssistant]);

  // Handle socket events for code execution
  useEffect(() => {
    if (!socket) return;

    const handleExecutionOutput = (data) => {
      setTerminalOutput((prev) => [
        ...prev,
        { type: "output", content: data.output },
      ]);
    };

    const handleExecutionError = (data) => {
      setTerminalOutput((prev) => [
        ...prev,
        { type: "error", content: data.error },
      ]);
      setIsRunning(false);
    };

    const handleExecutionDone = (data) => {
      setTerminalOutput((prev) => [
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

  // Auto-link CSS files to HTML files
  useEffect(() => {
    if (!files || !fileContent) return;

    // Find HTML files
    const htmlFiles = files.filter((file) => file.name.endsWith(".html"));

    // Find CSS files
    const cssFiles = files.filter((file) => file.name.endsWith(".css"));

    if (htmlFiles.length > 0 && cssFiles.length > 0) {
      const newCssLinks = { ...cssLinks };

      htmlFiles.forEach((htmlFile) => {
        const htmlContent = fileContent[htmlFile._id] || "";

        // Check if HTML already has link tags for CSS files
        cssFiles.forEach((cssFile) => {
          const cssFileName = cssFile.name;
          const linkExists =
            htmlContent.includes(`href="${cssFileName}"`) ||
            htmlContent.includes(`href='./${cssFileName}'`) ||
            htmlContent.includes(`href="./${cssFileName}"`);

          if (
            !linkExists &&
            !newCssLinks[htmlFile._id]?.includes(cssFile._id)
          ) {
            // Add CSS file to the links for this HTML file
            if (!newCssLinks[htmlFile._id]) {
              newCssLinks[htmlFile._id] = [];
            }
            newCssLinks[htmlFile._id].push(cssFile._id);
          }
        });
      });

      setCssLinks(newCssLinks);
    }
  }, [files, fileContent, activeFile]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setEditorInstance(editor);

    // Set up editor options
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'Fira Code', monospace",
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: "on",
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Save file - already handled by debounced save
      console.log("File saved");
    });

    // Add code completion provider
    monaco.languages.registerCompletionItemProvider("javascript", {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        return {
          suggestions: [
            {
              label: "console.log",
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: "console.log($1);",
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: range,
            },
            {
              label: "function",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "function ${1:name}(${2:params}) {\n\t${3}\n}",
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: range,
            },
            {
              label: "async function",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: "async function ${1:name}(${2:params}) {\n\t${3}\n}",
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: range,
            },
            {
              label: "try-catch",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText:
                "try {\n\t${1}\n} catch (error) {\n\tconsole.error(error);\n}",
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: range,
            },
          ],
        };
      },
    });
  };

  const handleEditorChange = (value) => {
    if (activeFile) {
      updateFileContent(activeFile._id, value);
    }
  };

  const getLanguageFromFileName = (fileName) => {
    if (!fileName) return "javascript";

    const extension = fileName.split(".").pop().toLowerCase();

    const languageMap = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      html: "html",
      css: "css",
      json: "json",
      md: "markdown",
      py: "python",
      java: "java",
      c: "c",
      cpp: "cpp",
      cs: "csharp",
      go: "go",
      rs: "rust",
      php: "php",
      rb: "ruby",
      sh: "shell",
      sql: "sql",
      xml: "xml",
      yaml: "yaml",
      yml: "yaml",
    };

    return languageMap[extension] || "plaintext";
  };

  const runCode = () => {
    if (!socket || !activeFile) return;

    setIsRunning(true);
    setShowTerminal(true);
    setActiveTerminalTab("terminal");
    setTerminalOutput([{ type: "info", content: "Running code..." }]);

    socket.emit("execution:run", {
      projectId,
      fileId: activeFile._id,
      language: getLanguageFromFileName(activeFile.name),
    });
  };

  const clearTerminal = () => {
    setTerminalOutput([]);
  };

  const toggleFileExplorer = () => {
    setShowFileExplorer(!showFileExplorer);
  };

  const toggleTerminal = () => {
    setShowTerminal(!showTerminal);
    if (!showTerminal) {
      setShowAIAssistant(false);
    }
  };

  const toggleAIAssistant = () => {
    setShowAIAssistant(!showAIAssistant);
    if (!showAIAssistant) {
      setShowTerminal(false);
    }
  };

  const toggleLivePreview = () => {
    setShowLivePreview(!showLivePreview);
  };

  if (loading) {
    return (
      <div className="editor-loading">
        <div className="spinner"></div>
        <p>Loading project...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="editor-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button
          className="btn btn-primary"
          onClick={() => window.history.back()}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <header className="editor-header">
        <div className="editor-header-left">
          <div className="logo" onClick={tohome}>
            <span className="gradient-text">
              <MdOutlineHome />
            </span>
          </div>
          <h1 className="project-name">{project?.name || "Project"}</h1>
        </div>

        <Toolbar
          runCode={runCode}
          isRunning={isRunning}
          toggleFileExplorer={toggleFileExplorer}
          showFileExplorer={showFileExplorer}
          toggleTerminal={toggleTerminal}
          showTerminal={showTerminal}
          toggleAIAssistant={toggleAIAssistant}
          showAIAssistant={showAIAssistant}
          toggleLivePreview={toggleLivePreview}
          showLivePreview={showLivePreview}
          toggleTheme={toggleTheme}
          darkMode={darkMode}
        />

        <div className="editor-header-right">
          <Collaborators
            collaborators={collaborators}
            currentUser={currentUser}
          />
        </div>
      </header>

      <div className="editor-main">
        {showFileExplorer && (
          <div className="file-explorer-container">
            <FileExplorer files={files} activeFile={activeFile} />
          </div>
        )}

        <div className={`editor-workspace ${editorLayout}`}>
          <div className="editor-area">
            <EditorTabs
              openedFiles={openedFiles}
              activeFile={activeFile}
              setActiveFile={setActiveFile}
              closeFile={closeFile}
            />

            <div className="monaco-container">
              {activeFile ? (
                <MonacoEditor
                  height="100%"
                  language={getLanguageFromFileName(activeFile.name)}
                  theme={editorTheme}
                  value={fileContent[activeFile._id] || ""}
                  onChange={handleEditorChange}
                  onMount={handleEditorDidMount}
                  options={{
                    readOnly: false,
                  }}
                />
              ) : (
                <div className="no-file-selected">
                  <p>No file selected</p>
                  <p>Select a file from the explorer or create a new one</p>
                </div>
              )}
            </div>
          </div>
          {showLivePreview && (
            <div className="preview-container">
              <div className="panel-header">
                <h3>Preview</h3>
                <button
                  className="panel-close"
                  onClick={toggleLivePreview}
                  aria-label="Close preview"
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
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <ErrorBoundary
                fallback={
                  <div className="preview-error">
                    <p>Preview failed to load due to a technical error.</p>
                    <p>Try running your code instead.</p>
                  </div>
                }
              >
                <LivePreview
                  projectId={projectId}
                  files={files}
                  fileContent={fileContent}
                  cssLinks={cssLinks}
                />
              </ErrorBoundary>
            </div>
          )}
          {showTerminal && (
            <div className="terminal-container">
              <div className="panel-header">
                <h3>Terminal</h3>
                <div className="panel-actions">
                  <button
                    className="panel-action"
                    onClick={clearTerminal}
                    aria-label="Clear terminal"
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
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      ></rect>
                      <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                  </button>
                  <button
                    className="panel-close"
                    onClick={toggleTerminal}
                    aria-label="Close terminal"
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
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="terminal-tabs">
                <button
                  className={`terminal-tab ${
                    activeTerminalTab === "terminal" ? "active" : ""
                  }`}
                  onClick={() => setActiveTerminalTab("terminal")}
                >
                  Terminal
                </button>
                <button
                  className={`terminal-tab ${
                    activeTerminalTab === "runner" ? "active" : ""
                  }`}
                  onClick={() => setActiveTerminalTab("runner")}
                >
                  Code Runner
                </button>
              </div>
              <div className="terminal-content">
                {activeTerminalTab === "terminal" ? (
                  <Terminal
                    projectId={projectId}
                    activeFile={activeFile}
                    fileContent={fileContent}
                    socket={socket}
                    output={terminalOutput}
                  />
                ) : (
                  <CodeRunner
                    socket={socket}
                    activeFile={activeFile}
                    fileContent={fileContent}
                  />
                )}
              </div>
            </div>
          )}
          {showAIAssistant && (
            <div className="ai-container">
              <div className="panel-header">
                <h3>AI Assistant</h3>
                <button
                  className="panel-close"
                  onClick={toggleAIAssistant}
                  aria-label="Close AI Assistant"
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
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <AIAssistant
                projectId={projectId}
                activeFile={activeFile}
                fileContent={fileContent}
                editorInstance={editorInstance}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Editor;
