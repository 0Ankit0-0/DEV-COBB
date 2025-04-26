import React, { useState } from "react"
import { useProject } from "../contexts/ProjectContext"
import "../styles/FileExplorer.css"

const FileExplorer = ({ files, activeFile }) => {
  const { createFile, deleteFile, renameFile, openFile } = useProject()

  const [expandedFolders, setExpandedFolders] = useState({})
  const [showNewFileInput, setShowNewFileInput] = useState(false)
  const [newFileName, setNewFileName] = useState("")
  const [newFileParentId, setNewFileParentId] = useState(null)
  const [newFileType, setNewFileType] = useState("file")
  const [renamingFile, setRenamingFile] = useState(null)
  const [newName, setNewName] = useState("")
  const [contextMenu, setContextMenu] = useState(null)

  const toggleFolder = (folderId) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }))
  }

  const handleFileClick = (file) => {
    if (file.type === "folder") {
      toggleFolder(file._id)
    } else {
      openFile(file)
    }
  }

  const handleNewFileClick = (parentId = null, type = "file") => {
    setNewFileParentId(parentId)
    setNewFileType(type)
    setNewFileName("")
    setShowNewFileInput(true)
  }

  const handleNewFileSubmit = async (e) => {
    e.preventDefault()

    if (!newFileName.trim()) {
      setShowNewFileInput(false)
      return
    }

    try {
      await createFile(newFileName, newFileParentId, newFileType)

      if (newFileType === "folder" && newFileParentId) {
        setExpandedFolders((prev) => ({
          ...prev,
          [newFileParentId]: true,
        }))
      }
    } catch (err) {
      console.error("Error creating file:", err)
    } finally {
      setShowNewFileInput(false)
    }
  }

  const handleRenameClick = (file) => {
    setRenamingFile(file)
    setNewName(file.name)
    setContextMenu(null)
  }

  const handleRenameSubmit = async (e) => {
    e.preventDefault()

    if (!newName.trim() || newName === renamingFile.name) {
      setRenamingFile(null)
      return
    }

    try {
      await renameFile(renamingFile._id, newName)
    } catch (err) {
      console.error("Error renaming file:", err)
    } finally {
      setRenamingFile(null)
    }
  }

  const handleDeleteClick = async (fileId) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      try {
        await deleteFile(fileId)
      } catch (err) {
        console.error("Error deleting file:", err)
      }
    }
    setContextMenu(null)
  }

  const handleContextMenu = (e, file) => {
    e.preventDefault()

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      file,
    })
  }

  const closeContextMenu = () => {
    setContextMenu(null)
  }

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      closeContextMenu()
    }

    document.addEventListener("click", handleClickOutside)

    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [])

  // Organize files into a tree structure
  const organizeFiles = () => {
    const fileMap = {}
    const rootFiles = []

    // First pass: create a map of all files
    files.forEach((file) => {
      fileMap[file._id] = { ...file, children: [] }
    })

    // Second pass: organize files into a tree
    files.forEach((file) => {
      if (file.parentId && fileMap[file.parentId]) {
        fileMap[file.parentId].children.push(fileMap[file._id])
      } else {
        rootFiles.push(fileMap[file._id])
      }
    })

    // Sort files: folders first, then alphabetically
    const sortFiles = (files) => {
      return files.sort((a, b) => {
        if (a.type === "folder" && b.type !== "folder") return -1
        if (a.type !== "folder" && b.type === "folder") return 1
        return a.name.localeCompare(b.name)
      })
    }

    // Sort root files and children recursively
    const sortedRootFiles = sortFiles(rootFiles)
    sortedRootFiles.forEach((file) => {
      if (file.children.length > 0) {
        file.children = sortFiles(file.children)
      }
    })

    return sortedRootFiles
  }

  const renderFileTree = (files, level = 0) => {
    return (
      <ul className={`file-list ${level > 0 ? "nested" : ""}`}>
        {files.map((file) => (
          <li key={file._id} className={`file-item ${file.type}`}>
            <div
              className={`file-item-content ${activeFile && activeFile._id === file._id ? "active" : ""}`}
              onClick={() => handleFileClick(file)}
              onContextMenu={(e) => handleContextMenu(e, file)}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
            >
              {file.type === "folder" && (
                <span className={`folder-icon ${expandedFolders[file._id] ? "open" : ""}`}>
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
                  <div className="new-file-input-container" style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}>
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
                )}
              </>
            )}
          </li>
        ))}

        {showNewFileInput && newFileParentId === null && level === 0 && (
          <li className="file-item">
            <div className="new-file-input-container" style={{ paddingLeft: "8px" }}>
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
    )
  }

  const organizedFiles = organizeFiles()

  return (
    <div className="file-explorer">
      <div className="file-explorer-header">
        <h2>Files</h2>
        <div className="file-explorer-actions">
          <button className="file-action-btn" onClick={() => handleNewFileClick(null, "file")} title="New File">
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
          <button className="file-action-btn" onClick={() => handleNewFileClick(null, "folder")} title="New Folder">
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
        </div>
      </div>

      <div className="file-explorer-content">{renderFileTree(organizedFiles)}</div>

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
                  handleNewFileClick(contextMenu.file._id, "file")
                  closeContextMenu()
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
                  handleNewFileClick(contextMenu.file._id, "folder")
                  closeContextMenu()
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
              <div className="context-menu-divider"></div>
            </>
          )}

          <button className="context-menu-item" onClick={() => handleRenameClick(contextMenu.file)}>
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
          <button className="context-menu-item delete" onClick={() => handleDeleteClick(contextMenu.file._id)}>
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
  )
}

export default FileExplorer
