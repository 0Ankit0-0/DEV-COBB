const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const Project = require("../models/Project");
const File = require("../models/File");
const FileContent = require("../models/FileContent");
const path = require("path");

// Helper function for access check
function hasAccess(project, userId) {
  return (
    project.owner.toString() === userId ||
    project.collaborators.includes(userId) ||
    project.isPublic // Optional: public access
  );
}

// Create a new file
router.post("/", protect, async (req, res) => {
  try {
    const { projectId, path: filePath, content = "", type = "file" } = req.body;

    // Check if project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!hasAccess(project, req.user.id)) {
      return res
        .status(403)
        .json({ message: "Not authorized to modify this project" });
    }

    // Check if file already exists
    const existingFile = await File.findOne({
      project: projectId,
      path: filePath,
    });

    if (existingFile) {
      return res.status(400).json({ message: "File already exists" });
    }

    // Create file
    const file = new File({
      project: projectId,
      path: filePath,
      type,
    });

    await file.save();

    // If it's a file (not a folder), create file content
    if (type === "file") {
      const fileContent = new FileContent({
        file: file._id,
        content,
      });

      await fileContent.save();
    }

    res.status(201).json(file);
  } catch (error) {
    console.error("Error creating file:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get file content
router.get("/:fileId/content", protect, async (req, res) => {
  try {
    const fileId = req.params.fileId;

    // Find the file
    const file = await File.findById(fileId).populate("project");

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Check if user has access to the project
    const project = file.project;
    if (!hasAccess(project, req.user.id)) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this file" });
    }

    // Get file content
    const fileContent = await FileContent.findOne({ file: fileId });

    if (!fileContent) {
      return res.status(404).json({ message: "File content not found" });
    }

    res.json({ content: fileContent.content });
  } catch (error) {
    console.error("Error getting file content:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update file content
router.put("/:fileId/content", protect, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const { content } = req.body;

    // Find the file
    const file = await File.findById(fileId).populate("project");

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Check if user has access to the project
    const project = file.project;
    if (!hasAccess(project, req.user.id)) {
      return res
        .status(403)
        .json({ message: "Not authorized to modify this file" });
    }

    // Update file content
    let fileContent = await FileContent.findOne({ file: fileId });

    if (!fileContent) {
      fileContent = new FileContent({
        file: fileId,
        content,
      });
    } else {
      fileContent.content = content;
    }

    await fileContent.save();

    res.json({ message: "File content updated" });
  } catch (error) {
    console.error("Error updating file content:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a file
router.delete("/:fileId", protect, async (req, res) => {
  try {
    const fileId = req.params.fileId;

    // Find the file
    const file = await File.findById(fileId).populate("project");

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Check if user has access to the project
    const project = file.project;
    if (!hasAccess(project, req.user.id)) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this file" });
    }

    // If it's a folder, delete all files inside
    if (file.type === "folder") {
      // Find all files that start with this folder path
      const folderPath = file.path;
      const filesInFolder = await File.find({
        project: project._id,
        path: { $regex: `^${folderPath}/` },
      });

      // Delete all file contents
      const fileIds = filesInFolder.map((f) => f._id);
      await FileContent.deleteMany({ file: { $in: fileIds } });

      // Delete all files
      await File.deleteMany({
        project: project._id,
        path: { $regex: `^${folderPath}/` },
      });

      // Also delete the folder content if it exists
      await FileContent.deleteOne({ file: fileId });
    } else {
      // Delete file content
      await FileContent.deleteOne({ file: fileId });
    }

    // Delete the file/folder itself
    await File.deleteOne({ _id: fileId });

    res.json({ message: "File deleted" });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Rename a file
router.put("/:fileId/rename", protect, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const { newPath } = req.body;

    // Find the file
    const file = await File.findById(fileId).populate("project");

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Check if user has access to the project
    const project = file.project;
    if (!hasAccess(project, req.user.id)) {
      return res
        .status(403)
        .json({ message: "Not authorized to modify this file" });
    }

    // Check if a file with the new path already exists
    const existingFile = await File.findOne({
      project: project._id,
      path: newPath,
    });

    if (existingFile) {
      return res
        .status(400)
        .json({ message: "A file with this name already exists" });
    }

    // If it's a folder, update all files inside
    if (file.type === "folder") {
      const oldPath = file.path;
      const filesInFolder = await File.find({
        project: project._id,
        path: { $regex: `^${oldPath}/` },
      });

      // Update paths for all files in the folder
      await Promise.all(
        filesInFolder.map(async (subFile) => {
          const relativePath = subFile.path.substring(oldPath.length);
          subFile.path = newPath + relativePath;
          return subFile.save();
        })
      );
    }

    // Update the file/folder path
    file.path = newPath;
    await file.save();

    res.json({ message: "File renamed", file });
  } catch (error) {
    console.error("Error renaming file:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Move a file
router.put("/:fileId/move", protect, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const { newPath } = req.body;

    // Find the file
    const file = await File.findById(fileId).populate("project");

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Check if user has access to the project
    const project = file.project;
    if (!hasAccess(project, req.user.id)) {
      return res
        .status(403)
        .json({ message: "Not authorized to modify this file" });
    }

    // Check if a file with the new path already exists
    const existingFile = await File.findOne({
      project: project._id,
      path: newPath,
    });

    if (existingFile) {
      return res.status(400).json({
        message: "A file with this name already exists at the destination",
      });
    }

    // If it's a folder, update all files inside
    if (file.type === "folder") {
      const oldPath = file.path;
      const filesInFolder = await File.find({
        project: project._id,
        path: { $regex: `^${oldPath}/` },
      });

      // Update paths for all files in the folder
      await Promise.all(
        filesInFolder.map(async (subFile) => {
          const relativePath = subFile.path.substring(oldPath.length);
          subFile.path = newPath + relativePath;
          return subFile.save();
        })
      );
    }

    // Update the file/folder path
    file.path = newPath;
    await file.save();

    res.json({ message: "File moved", file });
  } catch (error) {
    console.error("Error moving file:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
