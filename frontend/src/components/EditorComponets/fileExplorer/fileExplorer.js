import React, { useState, useEffect } from "react";
import { useProject } from "../contexts/projectContext";
import "./projectf.css";

// Additional CSS for FileExplorer component
const additionalStyles = `
.file-explorer {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  height: 100%;
  min-height: 400px;
}

.file-explorer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e9ecef;
}

.file-explorer-header h3 {
  margin: 0;
  color: #333;
}

.file-explorer-actions {
  display: flex;
  gap: 0.5rem;
}

.create-file-btn, .upload-file-btn {
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.upload-file-btn {
  position: relative;
  display: inline-block;
}

.file-tree {
  max-height: 500px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 2px;
}

.file-item:hover {
  background: #e9ecef;
}

.file-item.selected {
  background: #7c3aed;
  color: white;
}

.file-icon {
  margin-right: 0.5rem;
  font-size: 1rem;
}

.file-name {
  flex: 1;
  font-size: 0.9rem;
}

.file-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.file-item:hover .file-actions {
  opacity: 1;
}

.delete-file-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 2px;
}

.delete-file-btn:hover {
  background: rgba(255,0,0,0.1);
}

.empty-file-tree {
  text-align: center;
  color: #666;
  padding: 2rem;
}

.empty-file-tree button {
  background: #7c3aed;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 0.5rem;
}

.file-explorer-loading {
  text-align: center;
  color: #666;
  padding: 2rem;
}
`;

// Inject styles
if (typeof document !== "undefined") {
    const styleElement = document.createElement("style");
    styleElement.textContent = additionalStyles;
    document.head.appendChild(styleElement);
}

const FileExplorer = ({ projectId }) => {
    const { getFileTree, createFile, deleteFile, moveFile, uploadFile } =
        useProject();

    const [fileTree, setFileTree] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [selectedFile, setSelectedFile] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFileName, setNewFileName] = useState("");
    const [newFileType, setNewFileType] = useState("file");

    useEffect(() => {
        if (projectId) {
            loadFileTree();
        }
    }, [projectId]);

    const loadFileTree = async () => {
        try {
            setLoading(true);
            const tree = await getFileTree(projectId);
            setFileTree(tree);
        } catch (error) {
            console.error("Failed to load file tree:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFolder = (folderId) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId);
        } else {
            newExpanded.add(folderId);
        }
        setExpandedFolders(newExpanded);
    };

    const handleFileSelect = (file) => {
        setSelectedFile(file);
        // Emit file selection event or call parent handler
    };

    const handleCreateFile = async (e) => {
        e.preventDefault();
        if (!newFileName.trim()) return;

        try {
            const fileData = {
                name: newFileName,
                type: newFileType,
                projectId: projectId,
                content: newFileType === "file" ? "" : null,
                parentId: null, // Create at root level
            };

            await createFile(fileData);
            setShowCreateModal(false);
            setNewFileName("");
            setNewFileType("file");
            await loadFileTree();
        } catch (error) {
            console.error("Failed to create file:", error);
        }
    };

    const handleDeleteFile = async (fileId) => {
        if (window.confirm("Are you sure you want to delete this file?")) {
            try {
                await deleteFile(fileId);
                await loadFileTree();
                if (selectedFile && selectedFile.id === fileId) {
                    setSelectedFile(null);
                }
            } catch (error) {
                console.error("Failed to delete file:", error);
            }
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            await uploadFile(file);
            await loadFileTree();
        } catch (error) {
            console.error("Failed to upload file:", error);
        }
    };

    const getFileIcon = (file) => {
        if (file.type === "folder") return "📁";

        const extension = file.name.split(".").pop()?.toLowerCase();
        const iconMap = {
            js: "📜",
            jsx: "⚛️",
            ts: "📘",
            tsx: "⚛️",
            html: "🌐",
            css: "🎨",
            json: "📋",
            md: "📝",
            txt: "📄",
            py: "🐍",
            java: "☕",
            cpp: "⚙️",
            c: "⚙️",
            php: "🐘",
            rb: "💎",
            go: "🐹",
            rs: "🦀",
            sql: "🗃️",
            xml: "📋",
            yml: "⚙️",
            yaml: "⚙️",
        };

        return iconMap[extension] || "📄";
    };

    const renderFileTree = (files, level = 0) => {
        return files.map((file) => (
            <div key={file.id} style={{ marginLeft: `${level * 20}px` }}>
                <div
                    className={`file-item ${selectedFile?.id === file.id ? "selected" : ""
                        }`}
                    onClick={() => {
                        if (file.type === "folder") {
                            toggleFolder(file.id);
                        } else {
                            handleFileSelect(file);
                        }
                    }}
                >
                    <span className="file-icon">
                        {file.type === "folder" && (
                            <span className="folder-toggle">
                                {expandedFolders.has(file.id) ? "📂" : "📁"}
                            </span>
                        )}
                        {file.type !== "folder" && getFileIcon(file)}
                    </span>
                    <span className="file-name">{file.name}</span>
                    <div className="file-actions">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFile(file.id);
                            }}
                            className="delete-file-btn"
                            title="Delete"
                        >
                            🗑️
                        </button>
                    </div>
                </div>

                {file.type === "folder" &&
                    expandedFolders.has(file.id) &&
                    file.children &&
                    renderFileTree(file.children, level + 1)}
            </div>
        ));
    };

    if (loading) {
        return <div className="file-explorer-loading">Loading files...</div>;
    }

    return (
        <div className="file-explorer">
            <div className="file-explorer-header">
                <h3>Files</h3>
                <div className="file-explorer-actions">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="create-file-btn"
                        title="Create new file"
                    >
                        ➕
                    </button>
                    <label className="upload-file-btn" title="Upload file">
                        📤
                        <input
                            type="file"
                            onChange={handleFileUpload}
                            style={{ display: "none" }}
                        />
                    </label>
                </div>
            </div>

            <div className="file-tree">
                {fileTree.length > 0 ? (
                    renderFileTree(fileTree)
                ) : (
                    <div className="empty-file-tree">
                        <p>No files yet</p>
                        <button onClick={() => setShowCreateModal(true)}>
                            Create your first file
                        </button>
                    </div>
                )}
            </div>

            {/* Create File Modal */}
            {showCreateModal && (
                <div
                    className="modal-backdrop"
                    onClick={() => setShowCreateModal(false)}
                >
                    <form
                        className="modal-form"
                        onClick={(e) => e.stopPropagation()}
                        onSubmit={handleCreateFile}
                    >
                        <button
                            type="button"
                            className="modal-close"
                            onClick={() => setShowCreateModal(false)}
                        >
                            ×
                        </button>

                        <h2>Create New {newFileType}</h2>

                        <div>
                            <label>
                                <input
                                    type="radio"
                                    value="file"
                                    checked={newFileType === "file"}
                                    onChange={(e) => setNewFileType(e.target.value)}
                                />
                                File
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    value="folder"
                                    checked={newFileType === "folder"}
                                    onChange={(e) => setNewFileType(e.target.value)}
                                />
                                Folder
                            </label>
                        </div>

                        <input
                            type="text"
                            placeholder={`Enter ${newFileType} name`}
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            required
                            autoFocus
                        />

                        <button type="submit">Create {newFileType}</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default FileExplorer;
