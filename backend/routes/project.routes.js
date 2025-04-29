const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const Project = require("../models/Project");
const File = require("../models/File");
const FileContent = require("../models/FileContent");
const { createDefaultFiles } = require("../utils/templates");

// Get all projects for a user
router.get("/", protect, async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.user.id }).sort({
      updatedAt: -1,
    });
    res.json({ success: true, projects });
  } catch (err) {
    console.error("Error fetching projects:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch projects" });
  }
});

// Create a new project
router.post("/", protect, async (req, res) => {
  try {
    const { name, description, template } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Project name is required" });
    }

    // Create project
    const project = new Project({
      name,
      description: description || "",
      owner: req.user.id,
      template: template || "blank",
    });

    const savedProject = await project.save();

    // Create default files based on template
    await createDefaultFiles(savedProject._id, template || "blank");

    // Fetch the project with populated data
    const populatedProject = await Project.findById(savedProject._id);

    res.status(201).json({
      success: true,
      project: populatedProject,
      message: "Project created successfully",
    });
  } catch (err) {
    console.error("Error creating project:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to create project" });
  }
});

// Get a project by ID
router.get("/:id", protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Check if user owns the project or is a collaborator
    const isOwner = project.owner.toString() === req.user.id;
    const isCollaborator = project.collaborators.some(
      (collab) => collab.user.toString() === req.user.id
    );

    if (!isOwner && !isCollaborator) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to access this project",
        });
    }

    // Get files for the project
    const files = await File.find({ project: req.params.id }).sort({
      type: -1,
      name: 1,
    });

    res.json({ success: true, project, files });
  } catch (err) {
    console.error("Error fetching project:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch project" });
  }
});

// Update a project
router.put("/:id", protect, async (req, res) => {
  try {
    const { name, description } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Check if user owns the project
    if (project.owner.toString() !== req.user.id) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to update this project",
        });
    }

    // Update project fields
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    project.updatedAt = Date.now();

    await project.save();

    res.json({
      success: true,
      project,
      message: "Project updated successfully",
    });
  } catch (err) {
    console.error("Error updating project:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to update project" });
  }
});

// Delete a project
router.delete("/:id", protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Check if user owns the project
    if (project.owner.toString() !== req.user.id) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to delete this project",
        });
    }

    // Delete all files and file contents
    const files = await File.find({ project: req.params.id });

    for (const file of files) {
      await FileContent.findOneAndDelete({ file: file._id });
      await File.findByIdAndDelete(file._id);
    }

    // Delete the project
    await Project.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Project deleted successfully" });
  } catch (err) {
    console.error("Error deleting project:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete project" });
  }
});

// Add a collaborator to a project
router.post("/:id/collaborators", protect, async (req, res) => {
  try {
    const { userId, role } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Check if user owns the project
    if (project.owner.toString() !== req.user.id) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to add collaborators",
        });
    }

    // Check if user is already a collaborator
    const existingCollaborator = project.collaborators.find(
      (collab) => collab.user.toString() === userId
    );

    if (existingCollaborator) {
      return res
        .status(400)
        .json({ success: false, message: "User is already a collaborator" });
    }

    // Add collaborator
    project.collaborators.push({
      user: userId,
      role: role || "editor",
    });

    await project.save();

    res.json({
      success: true,
      project,
      message: "Collaborator added successfully",
    });
  } catch (err) {
    console.error("Error adding collaborator:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to add collaborator" });
  }
});

// Remove a collaborator from a project
router.delete("/:id/collaborators/:userId", protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    // Check if user owns the project
    if (project.owner.toString() !== req.user.id) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to remove collaborators",
        });
    }

    // Remove collaborator
    project.collaborators = project.collaborators.filter(
      (collab) => collab.user.toString() !== req.params.userId
    );

    await project.save();

    res.json({
      success: true,
      project,
      message: "Collaborator removed successfully",
    });
  } catch (err) {
    console.error("Error removing collaborator:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to remove collaborator" });
  }
});

// @route   POST /api/projects/:id/files
// @desc    Create a new file in a project
// @access  Private
router.post("/:id/files", protect, async (req, res) => {
  try {
    const { name, type, parentId, content } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user owns the project
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Check if file with same name exists in the same directory
    const existingFile = await File.findOne({
      project: req.params.id,
      name,
      parentId: parentId || null,
    });

    if (existingFile) {
      return res
        .status(400)
        .json({
          message: "File with this name already exists in this directory",
        });
    }

    // Create file
    const file = new File({
      name,
      type: type || "file",
      project: req.params.id,
      parentId: parentId || null,
      isMain: false,
    });

    await file.save();

    // Create file content if it's a file
    if (type !== "folder") {
      const fileContent = new FileContent({
        file: file._id,
        content: content || "",
      });

      await fileContent.save();
    }

    res.status(201).json({ file });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/projects/:id/files/:fileId/content
// @desc    Get file content
// @access  Private
router.get("/:id/files/:fileId/content", protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user owns the project or if it's public
    const isOwner = project.owner.toString() === req.user.id;
    const isCollaborator = project.collaborators.some(
      (collab) => collab.user.toString() === req.user.id
    );

    if (!isOwner && !isCollaborator) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to access this project",
        });
    }

    const file = await File.findOne({
      _id: req.params.fileId,
      project: req.params.id,
    });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    if (file.type === "folder") {
      return res
        .status(400)
        .json({ message: "Cannot get content of a folder" });
    }

    const fileContent = await FileContent.findOne({ file: req.params.fileId });

    if (!fileContent) {
      return res.status(404).json({ message: "File content not found" });
    }

    res.json({ content: fileContent.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/projects/:id/files/:fileId/content
// @desc    Update file content
// @access  Private
router.put("/:id/files/:fileId/content", protect, async (req, res) => {
  try {
    const { content } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user owns the project
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const file = await File.findOne({
      _id: req.params.fileId,
      project: req.params.id,
    });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    if (file.type === "folder") {
      return res
        .status(400)
        .json({ message: "Cannot update content of a folder" });
    }

    let fileContent = await FileContent.findOne({ file: req.params.fileId });

    if (!fileContent) {
      fileContent = new FileContent({
        file: req.params.fileId,
        content: content || "",
      });
    } else {
      fileContent.content = content || "";
    }

    await fileContent.save();

    res.json({ message: "File content updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/projects/:id/files/:fileId
// @desc    Update file (rename, move)
// @access  Private
router.put("/:id/files/:fileId", protect, async (req, res) => {
  try {
    const { name, parentId } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user owns the project
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const file = await File.findOne({
      _id: req.params.fileId,
      project: req.params.id,
    });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // Check if file with same name exists in the target directory
    if (name && name !== file.name) {
      const existingFile = await File.findOne({
        project: req.params.id,
        name,
        parentId: parentId !== undefined ? parentId : file.parentId,
        _id: { $ne: file._id },
      });

      if (existingFile) {
        return res
          .status(400)
          .json({
            message: "File with this name already exists in this directory",
          });
      }
    }

    // Update file
    if (name) file.name = name;
    if (parentId !== undefined) file.parentId = parentId;

    await file.save();

    res.json({ file });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   DELETE /api/projects/:id/files/:fileId
// @desc    Delete a file
// @access  Private
router.delete("/:id/files/:fileId", protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user owns the project
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const file = await File.findOne({
      _id: req.params.fileId,
      project: req.params.id,
    });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // If it's a folder, delete all children recursively
    if (file.type === "folder") {
      await deleteFolder(req.params.id, file._id);
    } else {
      // Delete file content
      await FileContent.findOneAndDelete({ file: file._id });
    }

    // Delete file
    await File.findByIdAndDelete(file._id);

    res.json({ message: "File deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/projects/:id/files/:fileId/copy
// @desc    Copy a file
// @access  Private
router.post("/:id/files/:fileId/copy", protect, async (req, res) => {
  try {
    const { targetParentId, newName } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user owns the project
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const sourceFile = await File.findOne({
      _id: req.params.fileId,
      project: req.params.id,
    });

    if (!sourceFile) {
      return res.status(404).json({ message: "Source file not found" });
    }

    // Generate a new name if not provided
    const copyName = newName || `Copy of ${sourceFile.name}`;

    // Check if file with same name exists in the target directory
    const existingFile = await File.findOne({
      project: req.params.id,
      name: copyName,
      parentId: targetParentId || sourceFile.parentId,
    });

    if (existingFile) {
      return res
        .status(400)
        .json({
          message: "File with this name already exists in the target directory",
        });
    }

    // Copy the file
    if (sourceFile.type === "folder") {
      // Copy folder and its contents
      const newFolderId = await copyFolder(
        req.params.id,
        sourceFile._id,
        targetParentId || sourceFile.parentId,
        copyName
      );

      const newFolder = await File.findById(newFolderId);
      res.json({ file: newFolder });
    } else {
      // Copy single file
      const newFile = new File({
        name: copyName,
        type: sourceFile.type,
        project: req.params.id,
        parentId: targetParentId || sourceFile.parentId,
        isMain: false,
      });

      await newFile.save();

      // Copy file content
      const sourceContent = await FileContent.findOne({ file: sourceFile._id });

      if (sourceContent) {
        const newContent = new FileContent({
          file: newFile._id,
          content: sourceContent.content,
        });

        await newContent.save();
      }

      res.json({ file: newFile });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Helper function to delete a folder and all its contents recursively
async function deleteFolder(projectId, folderId) {
  // Get all files in the folder
  const files = await File.find({
    project: projectId,
    parentId: folderId,
  });

  // Delete each file/subfolder
  for (const file of files) {
    if (file.type === "folder") {
      await deleteFolder(projectId, file._id);
    } else {
      await FileContent.findOneAndDelete({ file: file._id });
    }
    await File.findByIdAndDelete(file._id);
  }
}

// Helper function to copy a folder and all its contents recursively
async function copyFolder(projectId, sourceFolderId, targetParentId, newName) {
  // Create new folder
  const sourceFolder = await File.findById(sourceFolderId);

  const newFolder = new File({
    name: newName || sourceFolder.name,
    type: "folder",
    project: projectId,
    parentId: targetParentId,
    isMain: false,
  });

  await newFolder.save();

  // Get all files in the source folder
  const files = await File.find({
    project: projectId,
    parentId: sourceFolderId,
  });

  // Copy each file/subfolder
  for (const file of files) {
    if (file.type === "folder") {
      await copyFolder(projectId, file._id, newFolder._id, file.name);
    } else {
      const newFile = new File({
        name: file.name,
        type: file.type,
        project: projectId,
        parentId: newFolder._id,
        isMain: false,
      });

      await newFile.save();

      // Copy file content
      const sourceContent = await FileContent.findOne({ file: file._id });

      if (sourceContent) {
        const newContent = new FileContent({
          file: newFile._id,
          content: sourceContent.content,
        });

        await newContent.save();
      }
    }
  }

  return newFolder._id;
}

module.exports = router;
