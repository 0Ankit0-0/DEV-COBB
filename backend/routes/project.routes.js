const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const Project = require("../models/Project");
const File = require("../models/File");
const FileContent = require("../models/FileContent");
const { createTemplateFiles } = require("../utils/templates");
const User = require("../models/User"); // Added User import

// Check for any route definitions using full URLs
// For example, change:
// router.get('https://git.new/pathToRegexpError', ...)
// to:
// router.get('/path', ...)

// Make sure all route paths start with a slash, not http:// or https://
// Example of correct route definitions:
// router.get('/', ...)
// router.get('/:id', ...)
// router.post('/', ...)

// @route   GET /api/projects
// @desc    Get all projects for user
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    // Get projects where user is owner or collaborator
    const projects = await Project.find({
      $or: [{ owner: req.user.id }, { "collaborators.user": req.user.id }],
    }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const { name, description, template = "blank" } = req.body;

    // Create project
    const project = await Project.create({
      name,
      description,
      owner: req.user.id,
      template,
    });

    // Create template files
    await createTemplateFiles(project._id, template);

    res.status(201).json({
      success: true,
      project,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   GET /api/projects/:id
// @desc    Get a project by ID
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    // Find project
    const project = await Project.findById(req.params.id)
      .populate("owner", "name email")
      .populate("collaborators.user", "name email");

    // Check if project exists
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user is owner or collaborator
    const isOwner = project.owner._id.toString() === req.user.id;
    const isCollaborator = project.collaborators.some(
      (collab) => collab.user._id.toString() === req.user.id
    );

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this project",
      });
    }

    // Get all files for the project
    const files = await File.find({ project: req.params.id });

    res.status(200).json({
      success: true,
      project,
      files,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   PUT /api/projects/:id
// @desc    Update a project
// @access  Private
router.put("/:id", protect, async (req, res) => {
  try {
    const { name, description } = req.body;

    // Find project
    let project = await Project.findById(req.params.id);

    // Check if project exists
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user is owner
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this project",
      });
    }

    // Update project
    project = await Project.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      project,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   DELETE /api/projects/:id
// @desc    Delete a project
// @access  Private
router.delete("/:id", protect, async (req, res) => {
  try {
    // Find project
    const project = await Project.findById(req.params.id);

    // Check if project exists
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user is owner
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({
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

    // Delete project
    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Project deleted",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   POST /api/projects/:id/collaborators
// @desc    Add a collaborator to a project
// @access  Private
router.post("/:id/collaborators", protect, async (req, res) => {
  try {
    const { email, role = "editor" } = req.body;

    // Find project
    const project = await Project.findById(req.params.id);

    // Check if project exists
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user is owner
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to add collaborators to this project",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is already a collaborator
    const isCollaborator = project.collaborators.some(
      (collab) => collab.user.toString() === user._id.toString()
    );

    if (isCollaborator) {
      return res.status(400).json({
        success: false,
        message: "User is already a collaborator",
      });
    }

    // Add collaborator
    project.collaborators.push({
      user: user._id,
      role,
    });

    await project.save();

    res.status(200).json({
      success: true,
      project,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// File routes

// @route   POST /api/projects/:id/files
// @desc    Create a new file or folder
// @access  Private
router.post("/:id/files", protect, async (req, res) => {
  try {
    const { name, parentId = null, type = "file" } = req.body;

    // Find project
    const project = await Project.findById(req.params.id);

    // Check if project exists
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user is owner or collaborator
    const isOwner = project.owner.toString() === req.user.id;
    const isCollaborator = project.collaborators.some(
      (collab) => collab.user.toString() === req.user.id
    );

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this project",
      });
    }

    // Create file
    const file = await File.create({
      name,
      project: req.params.id,
      parentId,
      type,
    });

    // If it's a file (not a folder), create empty file content
    if (type === "file") {
      await FileContent.create({
        file: file._id,
        content: "",
      });
    }

    res.status(201).json({
      success: true,
      file,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   GET /api/projects/:id/files/:fileId/content
// @desc    Get file content
// @access  Private
router.get("/:id/files/:fileId/content", protect, async (req, res) => {
  try {
    // Find project
    const project = await Project.findById(req.params.id);

    // Check if project exists
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user is owner or collaborator
    const isOwner = project.owner.toString() === req.user.id;
    const isCollaborator = project.collaborators.some(
      (collab) => collab.user.toString() === req.user.id
    );

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this project",
      });
    }

    // Find file
    const file = await File.findOne({
      _id: req.params.fileId,
      project: req.params.id,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    // Get file content
    let fileContent = await FileContent.findOne({ file: file._id });

    if (!fileContent) {
      // Create empty file content if it doesn't exist
      fileContent = await FileContent.create({
        file: file._id,
        content: "",
      });
    }

    res.status(200).json({
      success: true,
      content: fileContent.content,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   PUT /api/projects/:id/files/:fileId/content
// @desc    Update file content
// @access  Private
router.put("/:id/files/:fileId/content", protect, async (req, res) => {
  try {
    const { content } = req.body;

    // Find project
    const project = await Project.findById(req.params.id);

    // Check if project exists
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user is owner or collaborator
    const isOwner = project.owner.toString() === req.user.id;
    const isCollaborator = project.collaborators.some(
      (collab) => collab.user.toString() === req.user.id
    );

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this project",
      });
    }

    // Find file
    const file = await File.findOne({
      _id: req.params.fileId,
      project: req.params.id,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    // Update file content
    let fileContent = await FileContent.findOne({ file: file._id });

    if (!fileContent) {
      // Create file content if it doesn't exist
      fileContent = await FileContent.create({
        file: file._id,
        content,
      });
    } else {
      // Update existing file content
      fileContent.content = content;
      await fileContent.save();
    }

    res.status(200).json({
      success: true,
      content: fileContent.content,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   PUT /api/projects/:id/files/:fileId
// @desc    Update file (rename)
// @access  Private
router.put("/:id/files/:fileId", protect, async (req, res) => {
  try {
    const { name } = req.body;

    // Find project
    const project = await Project.findById(req.params.id);

    // Check if project exists
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user is owner or collaborator
    const isOwner = project.owner.toString() === req.user.id;
    const isCollaborator = project.collaborators.some(
      (collab) => collab.user.toString() === req.user.id
    );

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this project",
      });
    }

    // Find and update file
    const file = await File.findOneAndUpdate(
      {
        _id: req.params.fileId,
        project: req.params.id,
      },
      { name },
      { new: true, runValidators: true }
    );

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    res.status(200).json({
      success: true,
      file,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// @route   DELETE /api/projects/:id/files/:fileId
// @desc    Delete a file or folder
// @access  Private
router.delete("/:id/files/:fileId", protect, async (req, res) => {
  try {
    // Find project
    const project = await Project.findById(req.params.id);

    // Check if project exists
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user is owner or collaborator
    const isOwner = project.owner.toString() === req.user.id;
    const isCollaborator = project.collaborators.some(
      (collab) => collab.user.toString() === req.user.id
    );

    if (!isOwner && !isCollaborator) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this project",
      });
    }

    // Find file
    const file = await File.findOne({
      _id: req.params.fileId,
      project: req.params.id,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    // If it's a folder, delete all child files and folders recursively
    if (file.type === "folder") {
      const deleteFilesRecursively = async (parentId) => {
        const childFiles = await File.find({
          project: req.params.id,
          parentId,
        });

        for (const childFile of childFiles) {
          if (childFile.type === "folder") {
            await deleteFilesRecursively(childFile._id);
          } else {
            await FileContent.findOneAndDelete({ file: childFile._id });
          }
          await File.findByIdAndDelete(childFile._id);
        }
      };

      await deleteFilesRecursively(file._id);
    } else {
      // Delete file content
      await FileContent.findOneAndDelete({ file: file._id });
    }

    // Delete the file/folder itself
    await File.findByIdAndDelete(file._id);

    res.status(200).json({
      success: true,
      message: "File deleted",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;
