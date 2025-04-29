import { useState, useEffect } from "react";
import { useProject } from "../contexts/ProjectContext";
import "../styles/FileExplorer.css";

const FileExplorer = ({ files, activeFile }) => {
  const { createFile, deleteFile, renameFile, openFile } = useProject();

  const [expandedFolders, setExpandedFolders] = useState({});
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileParentId, setNewFileParentId] = useState(null);
  const [newFileType, setNewFileType] = useState("file");
  const [renamingFile, setRenamingFile] = useState(null);
  const [newName, setNewName] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const [draggedFile, setDraggedFile] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [clipboard, setClipboard] = useState(null);
  const [clipboardOperation, setClipboardOperation] = useState(null); // 'copy' or 'cut'

  // Filter files based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredFiles(files);
      return;
    }

    const filtered = files.filter((file) =>
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFiles(filtered);
  }, [searchTerm, files]);

  const toggleFolder = (folderId) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleFileClick = (file) => {
    if (file.type === "folder") {
      toggleFolder(file._id);
    } else {
      openFile(file);
    }
  };

  const handleNewFileClick = (parentId = null, type = "file") => {
    setNewFileParentId(parentId);
    setNewFileType(type);
    setNewFileName("");
    setShowNewFileInput(true);
  };

  const handleNewFileSubmit = async (e) => {
    e.preventDefault();

    if (!newFileName.trim()) {
      setShowNewFileInput(false);
      return;
    }

    try {
      await createFile(newFileName, newFileParentId, newFileType);

      if (newFileType === "folder" && newFileParentId) {
        setExpandedFolders((prev) => ({
          ...prev,
          [newFileParentId]: true,
        }));
      }
    } catch (err) {
      console.error("Error creating file:", err);
    } finally {
      setShowNewFileInput(false);
    }
  };

  const handleRenameClick = (file) => {
    setRenamingFile(file);
    setNewName(file.name);
    setContextMenu(null);
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();

    if (!newName.trim() || newName === renamingFile.name) {
      setRenamingFile(null);
      return;
    }

    try {
      await renameFile(renamingFile._id, newName);
    } catch (err) {
      console.error("Error renaming file:", err);
    } finally {
      setRenamingFile(null);
    }
  };

  const handleDeleteClick = async (fileId) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      try {
        await deleteFile(fileId);
      } catch (err) {
        console.error("Error deleting file:", err);
      }
    }
    setContextMenu(null);
  };

  const handleContextMenu = (e, file) => {
    e.preventDefault();

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      file,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Drag and drop handlers
  const handleDragStart = (e, file) => {
    setDraggedFile(file);
    e.dataTransfer.setData("text/plain", file._id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, file) => {
    e.preventDefault();
    if (file && file.type === "folder" && file._id !== draggedFile?._id) {
      setDropTarget(file);
    }
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = async (e, targetFolder) => {
    e.preventDefault();
    setDropTarget(null);

    if (!draggedFile || !targetFolder || draggedFile._id === targetFolder._id)
      return;

    // Don't allow dropping a folder into its own descendant
    if (isDescendantOf(targetFolder, draggedFile)) return;

    try {
      // In a real implementation, you would call an API to move the file
      // For now, we'll simulate by deleting and recreating
      const fileData = {
        name: draggedFile.name,
        type: draggedFile.type,
        parentId: targetFolder._id,
      };

      // Create a new file with the same name but new parent
      const newFile = await createFile(
        draggedFile.name,
        targetFolder._id,
        draggedFile.type
      );

      // If it's a file (not a folder), copy the content
      if (draggedFile.type === "file") {
        // In a real implementation, you would copy the file content
      }

      // Delete the old file
      await deleteFile(draggedFile._id);

      // Expand the target folder
      setExpandedFolders((prev) => ({
        ...prev,
        [targetFolder._id]: true,
      }));
    } catch (err) {
      console.error("Error moving file:", err);
    }

    setDraggedFile(null);
  };

  // Check if folder is a descendant of another folder
  const isDescendantOf = (folder, potentialAncestor) => {
    if (folder.parentId === potentialAncestor._id) return true;

    const parent = files.find((f) => f._id === folder.parentId);
    if (!parent) return false;

    return isDescendantOf(parent, potentialAncestor);
  };

  // Copy and paste handlers
  const handleCopy = (file) => {
    setClipboard(file);
    setClipboardOperation("copy");
    setContextMenu(null);
  };

  const handleCut = (file) => {
    setClipboard(file);
    setClipboardOperation("cut");
    setContextMenu(null);
  };

  const handlePaste = async (targetFolderId) => {
    if (!clipboard) return;

    try {
      if (clipboardOperation === "copy") {
        // Copy the file
        await createFile(clipboard.name, targetFolderId, clipboard.type);
      } else if (clipboardOperation === "cut") {
        // Move the file (similar to drag and drop)
        const newFile = await createFile(
          clipboard.name,
          targetFolderId,
          clipboard.type
        );
        await deleteFile(clipboard._id);
      }

      // Clear clipboard after paste
      setClipboard(null);
      setClipboardOperation(null);
    } catch (err) {
      console.error("Error pasting file:", err);
    }
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      closeContextMenu();
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Organize files into a tree structure
  const organizeFiles = () => {
    const fileMap = {};
    const rootFiles = [];

    // First pass: create a map of all files
    filteredFiles.forEach((file) => {
      fileMap[file._id] = { ...file, children: [] };
    });

    // Second pass: organize files into a tree
    filteredFiles.forEach((file) => {
      if (file.parentId && fileMap[file.parentId]) {
        fileMap[file.parentId].children.push(fileMap[file._id]);
      } else {
        rootFiles.push(fileMap[file._id]);
      }
    });

    // Sort files: folders first, then alphabetically
    const sortFiles = (files) => {
      return files.sort((a, b) => {
        if (a.type === "folder" && b.type !== "folder") return -1;
        if (a.type !== "folder" && b.type === "folder") return 1;
        return a.name.localeCompare(b.name);
      });
    };

    // Sort root files and children recursively
    const sortedRootFiles = sortFiles(rootFiles);
    sortedRootFiles.forEach((file) => {
      if (file.children.length > 0) {
        file.children = sortFiles(file.children);
      }
    });

    return sortedRootFiles;
  };

  const renderFileTree = (files, level = 0) => {
    return (
      <ul className={`file-list ${level > 0 ? "nested" : ""}`}>
        {files.map((file) => (
          <li
            key={file._id}
            className={`file-item ${file.type} ${
              dropTarget && dropTarget._id === file._id ? "drop-target" : ""
            }`}
            draggable={true}
            onDragStart={(e) => handleDragStart(e, file)}
            onDragOver={(e) => handleDragOver(e, file)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, file)}
          >
            <div
              className={`file-item-content ${
                activeFile && activeFile._id === file._id ? "active" : ""
              }`}
              onClick={() => handleFileClick(file)}
              onContextMenu={(e) => handleContextMenu(e, file)}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
            >
              {file.type === "folder" && (
                <span
                  className={`folder-icon ${
                    expandedFolders[file._id] ? "open" : ""
                  }`}
                >
                  {expandedFolders[file._id] ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                  )}
                </span>
              )}

              {file.type === "file" && (
                <span className="file-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                </span>
              )}

              {renamingFile && renamingFile._id === file._id ? (
                <form onSubmit={handleRenameSubmit} onBlur={handleRenameSubmit}>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    autoFocus
                    className="rename-input"
                    onClick={(e) => e.stopPropagation()}
                  />
                </form>
              ) : (
                <span className="file-name">{file.name}</span>
              )}
            </div>

            {file.type === "folder" && expandedFolders[file._id] && (
              <>
                {renderFileTree(file.children, level + 1)}
                {showNewFileInput && newFileParentId === file._id && (
                  <div
                    className="new-file-input-container"
                    style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
                  >
                    <form
                      onSubmit={handleNewFileSubmit}
                      onBlur={handleNewFileSubmit}
                    >
                      <input
                        type="text"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        placeholder={`New ${newFileType}...`}
                        autoFocus
                        className="new-file-input"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </form>
                  </div>
                )}
              </>
            )}
          </li>
        ))}

        {showNewFileInput && newFileParentId === null && level === 0 && (
          <li className="file-item">
            <div
              className="new-file-input-container"
              style={{ paddingLeft: "8px" }}
            >
              <form onSubmit={handleNewFileSubmit} onBlur={handleNewFileSubmit}>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder={`New ${newFileType}...`}
                  autoFocus
                  className="new-file-input"
                  onClick={(e) => e.stopPropagation()}
                />
              </form>
            </div>
          </li>
        )}
      </ul>
    );
  };

  const organizedFiles = organizeFiles();

  return (
    <div className="file-explorer">
      <div className="file-explorer-header">
        <h2>Files</h2>
        <div className="file-explorer-actions">
          <button
            className="file-action-btn"
            onClick={() => handleNewFileClick(null, "file")}
            title="New File"
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
          </button>
          <button
            className="file-action-btn"
            onClick={() => handleNewFileClick(null, "folder")}
            title="New Folder"
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
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              <line x1="12" y1="11" x2="12" y2="17"></line>
              <line x1="9" y1="14" x2="15" y2="14"></line>
            </svg>
          </button>
          <button
            className="file-action-btn"
            onClick={() => setSearchTerm("")}
            title="Refresh"
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
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
          </button>
        </div>
      </div>

      <div className="file-explorer-search">
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button className="clear-search" onClick={() => setSearchTerm("")}>
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
        )}
      </div>

      <div className="file-explorer-content">
        {renderFileTree(organizedFiles)}
      </div>

      {contextMenu && (
        <div
          className="context-menu"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
          }}
        >
          {contextMenu.file.type === "folder" && (
            <>
              <button
                className="context-menu-item"
                onClick={() => {
                  handleNewFileClick(contextMenu.file._id, "file");
                  closeContextMenu();
                }}
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
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="12" y1="18" x2="12" y2="12"></line>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
                <span>New File</span>
              </button>
              <button
                className="context-menu-item"
                onClick={() => {
                  handleNewFileClick(contextMenu.file._id, "folder");
                  closeContextMenu();
                }}
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
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  <line x1="12" y1="11" x2="12" y2="17"></line>
                  <line x1="9" y1="14" x2="15" y2="14"></line>
                </svg>
                <span>New Folder</span>
              </button>
              <button
                className="context-menu-item"
                onClick={() => {
                  handlePaste(contextMenu.file._id);
                  closeContextMenu();
                }}
                disabled={!clipboard}
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
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                </svg>
                <span>Paste</span>
              </button>
              <div className="context-menu-divider"></div>
            </>
          )}

          <button
            className="context-menu-item"
            onClick={() => handleCopy(contextMenu.file)}
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
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copy</span>
          </button>
          <button
            className="context-menu-item"
            onClick={() => handleCut(contextMenu.file)}
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
              <circle cx="6" cy="6" r="3"></circle>
              <circle cx="18" cy="18" r="3"></circle>
              <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
              <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
              <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
            </svg>
            <span>Cut</span>
          </button>
          <button
            className="context-menu-item"
            onClick={() => handleRenameClick(contextMenu.file)}
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
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>Rename</span>
          </button>
          <button
            className="context-menu-item delete"
            onClick={() => handleDeleteClick(contextMenu.file._id)}
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
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;
