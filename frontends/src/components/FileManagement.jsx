import { useState, useRef, useEffect } from "react";
import { useProject } from "../contexts/ProjectContext";
import { useAuth } from "../contexts/AuthContext";
import "../styles/FileManager.css";
import {
  FaFile,
  FaFolder,
  FaFolderOpen,
  FaTrash,
  FaEdit,
  FaPlus,
} from "react-icons/fa";

const FileManager = () => {
  const {
    currentProject,
    projectFiles,
    createFile,
    createFolder,
    deleteFile,
    renameFile,
    moveFile,
    openFile,
  } = useProject();
  const { user } = useAuth();
  const [newItemName, setNewItemName] = useState("");
  const [newItemType, setNewItemType] = useState("file");
  const [isCreating, setIsCreating] = useState(false);
  const [currentPath, setCurrentPath] = useState("/");
  const [editingItem, setEditingItem] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});
  const inputRef = useRef(null);

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  useEffect(() => {
    if (editingItem && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingItem]);

  const handleCreateItem = () => {
    if (!newItemName.trim()) return;

    if (newItemType === "file") {
      createFile(currentPath, newItemName);
    } else {
      createFolder(currentPath, newItemName);
    }

    setNewItemName("");
    setIsCreating(false);
  };

  const handleRename = () => {
    if (!newItemName.trim() || !editingItem) return;
    renameFile(editingItem.path, newItemName);
    setNewItemName("");
    setEditingItem(null);
  };

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.setData("text/plain", item.path);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, item) => {
    e.preventDefault();
    if (item && item.type === "folder") {
      e.currentTarget.classList.add("drag-over");
    }
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove("drag-over");
  };

  const handleDrop = (e, targetItem) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");

    if (!draggedItem || !targetItem || draggedItem.path === targetItem.path)
      return;

    if (targetItem.type === "folder") {
      const newPath = `${targetItem.path}/${draggedItem.name}`;
      moveFile(draggedItem.path, newPath);
    }

    setDraggedItem(null);
  };

  const toggleFolder = (folderPath) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  const renderFileTree = (files, basePath = "/") => {
    const items = [];
    const folders = {};

    // Group files by folder
    files.forEach((file) => {
      const path = file.path;
      const parts = path.split("/").filter((p) => p);

      if (parts.length === 1 && path.startsWith(basePath)) {
        // This is a file or folder directly in the current path
        items.push(file);
      } else if (parts.length > 1 && path.startsWith(basePath)) {
        // This is a file in a subfolder
        const folderName = parts[0];
        const folderPath = `/${folderName}`;

        if (!folders[folderPath]) {
          folders[folderPath] = {
            name: folderName,
            path: folderPath,
            type: "folder",
            children: [],
          };
        }

        folders[folderPath].children.push({
          ...file,
          name: parts.slice(1).join("/"),
        });
      }
    });

    // Add folders to items
    Object.values(folders).forEach((folder) => {
      items.push(folder);
    });

    return items.map((item) => {
      const isFolder = item.type === "folder";
      const isExpanded = expandedFolders[item.path];

      return (
        <div
          key={item.path}
          className="file-item"
          draggable
          onDragStart={(e) => handleDragStart(e, item)}
          onDragOver={(e) => handleDragOver(e, item)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, item)}
        >
          <div className="file-item-header">
            {isFolder ? (
              <span
                className="folder-icon"
                onClick={() => toggleFolder(item.path)}
              >
                {isExpanded ? <FaFolderOpen /> : <FaFolder />}
              </span>
            ) : (
              <span className="file-icon">
                <FaFile />
              </span>
            )}

            {editingItem && editingItem.path === item.path ? (
              <div className="rename-input-container">
                <input
                  ref={inputRef}
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => e.key === "Enter" && handleRename()}
                />
              </div>
            ) : (
              <span
                className="file-name"
                onClick={() =>
                  isFolder ? toggleFolder(item.path) : openFile(item.path)
                }
              >
                {item.name}
              </span>
            )}

            <div className="file-actions">
              <button
                className="action-btn"
                onClick={() => {
                  setEditingItem(item);
                  setNewItemName(item.name);
                }}
              >
                <FaEdit />
              </button>
              <button
                className="action-btn"
                onClick={() => deleteFile(item.path)}
              >
                <FaTrash />
              </button>
            </div>
          </div>

          {isFolder && isExpanded && item.children && (
            <div className="folder-contents">
              {renderFileTree(item.children, item.path)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="file-manager">
      <div className="file-manager-header">
        <h3>Files</h3>
        <button className="new-file-btn" onClick={() => setIsCreating(true)}>
          <FaPlus />
        </button>
      </div>

      {isCreating && (
        <div className="new-item-form">
          <select
            value={newItemType}
            onChange={(e) => setNewItemType(e.target.value)}
          >
            <option value="file">File</option>
            <option value="folder">Folder</option>
          </select>
          <input
            ref={inputRef}
            type="text"
            placeholder={`New ${newItemType} name`}
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateItem()}
          />
          <div className="form-actions">
            <button onClick={handleCreateItem}>Create</button>
            <button onClick={() => setIsCreating(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="file-tree">
        {projectFiles && projectFiles.length > 0 ? (
          renderFileTree(projectFiles)
        ) : (
          <p className="no-files">No files yet. Create one to get started!</p>
        )}
      </div>
    </div>
  );
};

export default FileManager;
