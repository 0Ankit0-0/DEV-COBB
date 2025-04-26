import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useProject } from "../contexts/ProjectContext";
import { useSocket } from "../contexts/SocketContext";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import MonacoEditor from "@monaco-editor/react";
import FileExplorer from "../components/FileExplorer";
import EditorTabs from "../components/EditorTabs";
import Terminal from "../components/Terminal";
import AIAssistant from "../components/AIAssistant";
import LivePreview from "../components/LivePreview";
import Toolbar from "../components/Toolbar";
import Collaborators from "../components/Collaborators";
import { IoHomeOutline } from "react-icons/io5";
import "../styles/Editor.css";

import {
  registerLanguages,
  initLanguageClient,
  configureEditor,
} from "../services/monacoLanguageService";

const Editor = () => {
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

  const [editorLayout, setEditorLayout] = useState("default");
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [editorInstance, setEditorInstance] = useState(null);
  const [editorTheme, setEditorTheme] = useState(darkMode ? "vs-dark" : "vs");
  const [languageClient, setLanguageClient] = useState(null);
  const [monaco, setMonaco] = useState(null);

  const navigate = useNavigate();
  const editorRef = useRef(null);

  const toHome = () => {
    navigate("/dashboard");
  };

  useEffect(() => {
    setEditorTheme(darkMode ? "vs-dark" : "vs");
  }, [darkMode]);

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

    const handleExecutionDone = () => {
      setTerminalOutput((prev) => [
        ...prev,
        { type: "info", content: "Execution completed" },
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

  // Initialize Monaco language support
  useEffect(() => {
    if (!monaco) return;

    try {
      // Only register languages if monaco is available
      registerLanguages(monaco);
    } catch (err) {
      console.error("Error registering languages:", err);
    }
  }, [monaco]);

  // Initialize language client when active file changes
  useEffect(() => {
    const initClient = async () => {
      if (editorInstance && activeFile) {
        try {
          // Cleanup previous client
          if (languageClient) {
            try {
              await languageClient.stop();
            } catch (err) {
              console.error("Error stopping previous language client:", err);
            }
          }

          const language = getLanguageFromFileName(activeFile.name);
          const client = await initLanguageClient(editorInstance, language);
          setLanguageClient(client);
        } catch (err) {
          console.error("Error initializing language client:", err);
        }
      }
    };

    initClient();
  }, [activeFile, editorInstance]);

  const handleEditorWillMount = (monacoInstance) => {
    // Store monaco instance for later use
    setMonaco(monacoInstance);
  };

  const handleEditorDidMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    setEditorInstance(editor);
    setMonaco(monacoInstance);

    try {
      // Configure editor
      configureEditor(editor);

      // Add keyboard shortcuts
      editor.addCommand(
        monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS,
        () => {
          console.log("File saved");
          // Here you could trigger an actual save action to your backend
          if (activeFile) {
            // You might want to add UI feedback like a toast notification
            console.log(`File ${activeFile.name} saved`);
          }
        }
      );

      // Format document shortcut
      editor.addCommand(
        monacoInstance.KeyMod.Alt |
          monacoInstance.KeyMod.Shift |
          monacoInstance.KeyCode.KeyF,
        () => {
          editor.getAction("editor.action.formatDocument")?.run();
        }
      );
    } catch (err) {
      console.error("Error setting up editor:", err);
    }
  };

  const handleEditorChange = (value) => {
    if (activeFile) {
      updateFileContent(activeFile._id, value);

      // If connected via socket, broadcast changes
      if (socket && connected) {
        socket.emit("file:update", {
          projectId,
          fileId: activeFile._id,
          content: value,
          userId: currentUser?.id,
        });
      }
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
          <div className="logo">
            <span className="gradient-text" onClick={toHome}>
              <IoHomeOutline />
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
                  beforeMount={handleEditorWillMount}
                  onMount={handleEditorDidMount}
                  options={{
                    readOnly: false,
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    minimap: { enabled: true },
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on",
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
              <LivePreview
                projectId={projectId}
                files={files}
                fileContent={fileContent}
              />
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
              <Terminal output={terminalOutput} />
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
