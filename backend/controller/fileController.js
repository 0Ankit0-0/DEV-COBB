const asyncHandler = require("express-async-handler");
const File = require("../models/file");
const Project = require("../models/project");
const Path = require("path");
const path = require("path");

// Fix: Consistent spelling
const checkProjectAccess = async (projectId, userId, requiredRole = 'viewer') => {
    const project = await Project.findById(projectId);
    if (!project) throw new Error("Project not found");

    if (project.owner.toString() === userId.toString()) return { project, role: 'owner' };

    const collaborator = project.collaborators.find(
        (collab) => collab.user.toString() === userId.toString()
    );
    if (!collaborator) {
        if (!project.isPublic) throw new Error("You do not have access to this project");
        return { project, role: 'viewer' };
    }

    const roleHierarchy = {
        'owner': 3,
        "admin": 2,
        'editor': 1,
        'viewer': 0,
    };

    const userRole = roleHierarchy[collaborator.role];
    const requiredRoleValue = roleHierarchy[requiredRole];
    if (userRole < requiredRoleValue) {
        throw new Error(`You do not have ${requiredRole} access to this project`);
    }
    return { project, role: collaborator.role };
};

const getLanguageExtension = (fileName) => {
    const ext = Path.extname(fileName).toLowerCase();
    const languageMap = {
        '.js': 'javascript',
        '.jsx': 'javascript',
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.py': 'python',
        '.java': 'java',
        '.cpp': 'cpp',
        '.c': 'c',
        '.cs': 'csharp',
        '.php': 'php',
        '.rb': 'ruby',
        '.go': 'go',
        '.rs': 'rust',
        '.html': 'html',
        '.css': 'css',
        '.scss': 'scss',
        '.sass': 'sass',
        '.json': 'json',
        '.xml': 'xml',
        '.md': 'markdown',
        '.sql': 'sql',
        '.sh': 'bash',
        '.yml': 'yaml',
        '.yaml': 'yaml',
        '.txt': 'text',
    };
    return languageMap[ext] || 'text';
};

const createFile = asyncHandler(async (req, res) => {
    const { name, type, content, parentId, projectId, path: filePath } = req.body;

    if (!name || !type || !projectId) {
        res.status(400);
        throw new Error("Name, type and projectId are required");
    }

    try {
        await checkProjectAccess(projectId, req.user._id, 'editor');
    } catch (error) {
        res.status(403);
        throw new Error(error.message);
    }

    let parentFolder = null;
    if (parentId) {
        parentFolder = await File.findById(parentId);
        if (!parentFolder || parentFolder.type !== 'folder') {
            res.status(400);
            throw new Error("Parent folder not found or invalid");
        }
        if (parentFolder.project.toString() !== projectId.toString()) {
            res.status(400);
            throw new Error("Parent folder does not belong to the project");
        }
    }

    let fullPath = filePath || name;
    if (!fullPath) {
        const parentPath = parentFolder ? parentFolder.path : '';
        fullPath = parentPath ? `${parentPath}/${name}` : name;
    }

    const existingFile = await File.findOne({ path: fullPath, project: projectId });
    if (existingFile) {
        res.status(400);
        throw new Error("File with this name already exists in the project");
    }

    const file = await File.create({
        name,
        type,
        content: content || "",
        path: fullPath,
        parent: parentId || null,
        project: projectId,
        creator: req.user.id,
        lastModifiedBy: req.user.id,
        language: type === "file" ? getLanguageExtension(name) : undefined,
    });

    const populatedFile = await File.findById(file._id)
        .populate("creator", "name username avatar")
        .populate("lastModifiedBy", "name username avatar")
        .populate("parent", "name path");

    res.status(201).json(populatedFile);
});

const getProjectFiles = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { parentId } = req.query;

    try {
        await checkProjectAccess(projectId, req.user?._id || null, 'viewer');
    } catch (error) {
        res.status(403);
        throw new Error(error.message);
    }

    const query = { project: projectId };
    if (parentId) {
        query.parent = parentId;
    } else {
        query.parent = null; // Get root files
    }

    const files = await File.find(query)
        .populate("creator", "name username avatar")
        .populate("lastModifiedBy", "name username avatar")
        .populate("parent", "name path");

    res.status(200).json(files);
});

const getFileTree = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    try {
        await checkProjectAccess(projectId, req.user?._id || null, 'viewer');
    } catch (error) {
        res.status(403);
        throw new Error(error.message);
    }

    const files = await File.find({ project: projectId })
        .populate("creator", "name username avatar")
        .populate("lastModifiedBy", "name username avatar")
        .populate("parent", "name path");

    const buildTree = (files, parentId = null) => {
        return files
            .filter(file =>
                (parentId === null && !file.parent) ||
                (file.parent && file.parent.toString() === parentId?.toString())
            )
            .map(file => ({
                ...file.toObject(),
                children: file.type === "folder" ? buildTree(files, file._id.toString()) : [],
            }));
    };

    const tree = buildTree(files);
    res.status(200).json(tree);
});

const getFile = asyncHandler(async (req, res) => {
    const file = await File.findById(req.params.fileId)
        .populate("creator", "name username avatar")
        .populate("lastModifiedBy", "name username avatar")
        .populate("parent", "name path")
        .populate("comments.user", "name username avatar");

    if (!file) {
        res.status(404);
        throw new Error("File not found");
    }

    try {
        await checkProjectAccess(file.project.toString(), req.user?._id || null, 'viewer');
    } catch (error) {
        res.status(403);
        throw new Error(error.message);
    }

    res.status(200).json(file);
});

const updateFile = asyncHandler(async (req, res) => {
    const file = await File.findById(req.params.fileId);

    if (!file) {
        res.status(404);
        throw new Error("File not found");
    }

    try {
        await checkProjectAccess(file.project.toString(), req.user?._id || null, 'editor');
    } catch (error) {
        res.status(403);
        throw new Error(error.message);
    }

    const { name, content, isOpen, language } = req.body;

    if (name && name !== file.name) {
        const parentPath = file.parent ?
            (await File.findById(file.parent)).path : '';
        const newPath = parentPath ? `${parentPath}/${name}` : name;
        const existingFile = await File.findOne({
            path: newPath,
            project: file.project,
            _id: { $ne: file._id }
        });

        if (existingFile) {
            res.status(400);
            throw new Error("File with this name already exists in the project");
        }

        file.name = name;
        file.path = newPath;
    }

    if (content !== undefined) file.content = content;
    if (isOpen !== undefined) file.isOpen = isOpen;

    if (language && language !== file.language) {
        file.language = language;
    } else if (!language && file.type === 'file') {
        file.language = getLanguageExtension(file.name);
    }

    if (name && !file.language) {
        file.language = getLanguageExtension(name);
    }

    file.lastModifiedBy = req.user._id;

    const updatedFile = await file.save();

    const populatedFile = await File.findById(updatedFile._id)
        .populate("creator", "name username avatar")
        .populate("lastModifiedBy", "name username avatar")
        .populate("parent", "name path");

    res.status(200).json(populatedFile);
});

const deleteFile = asyncHandler(async (req, res) => {
    const file = await File.findById(req.params.fileId);

    if (!file) {
        res.status(404);
        throw new Error("File not found");
    }

    try {
        await checkProjectAccess(file.project.toString(), req.user?._id || null, 'editor');
    } catch (error) {
        res.status(403);
        throw new Error(error.message);
    }

    // If folder, recursively delete children
    if (file.type === 'folder') {
        const deleteChildren = async (folderId) => {
            const children = await File.find({ parent: folderId });
            for (const child of children) {
                if (child.type === 'folder') {
                    await deleteChildren(child._id);
                }
                await child.remove();
            }
        };
        await deleteChildren(file._id);
    }

    await File.findByIdAndDelete(req.params.fileId);

    res.status(200).json({ message: "File deleted successfully" });
});

const moveFile = asyncHandler(async (req, res) => {
    const { newParentId, newName } = req.body;
    const file = await File.findById(req.params.fileId);

    if (!file) {
        res.status(404);
        throw new Error("File not found");
    }

    try {
        await checkProjectAccess(file.project.toString(), req.user?._id || null, 'editor');
    } catch (error) {
        res.status(403);
        throw new Error(error.message);
    }

    let newParent = null;

    if (newParentId) {
        newParent = await File.findById(newParentId);
        if (!newParent || newParent.type !== 'folder') {
            res.status(400);
            throw new Error("New parent folder not found or invalid");
        }
        if (newParent.project.toString() !== file.project.toString()) {
            res.status(400);
            throw new Error("New parent folder does not belong to the project");
        }
        if (newParent._id.toString() === file._id.toString()) {
            res.status(400);
            throw new Error("Cannot move file into itself");
        }
    } else {
        newParent = null; // Move to root
    }

    const fileName = newName || file.name;
    const parentPath = newParent ? newParent.path : '';
    const newPath = parentPath ? `${parentPath}/${fileName}` : fileName;

    const existingFile = await File.findOne({
        project: file.project,
        path: newPath,
        _id: { $ne: file._id }
    });

    if (existingFile) {
        res.status(400);
        throw new Error("File with this name already exists in the project");
    }

    file.parent = newParent ? newParent._id : null;
    file.path = newPath;
    if (newName && newName !== file.name) {
        file.name = newName;
    }
    file.lastModifiedBy = req.user._id;

    const updatedFile = await file.save();

    if (file.type === 'folder') {
        const updateChildrenPaths = async (folderId, parentPath) => {
            const children = await File.find({ parent: folderId });
            for (const child of children) {
                const childNewPath = `${parentPath}/${child.name}`;
                child.path = childNewPath;
                await child.save();
                if (child.type === 'folder') {
                    await updateChildrenPaths(child._id, childNewPath);
                }
            }
        };
        await updateChildrenPaths(updatedFile._id, updatedFile.path);
    }

    const populatedFile = await File.findById(updatedFile._id)
        .populate("creator", "name username avatar")
        .populate("lastModifiedBy", "name username avatar")
        .populate("parent", "name path");

    res.status(200).json(populatedFile);
});

const addComment = asyncHandler(async (req, res) => {
    const { text, line } = req.body;
    const file = await File.findById(req.params.fileId);

    if (!file) {
        res.status(404);
        throw new Error("File not found");
    }

    try {
        await checkProjectAccess(file.project.toString(), req.user?._id || null, 'editor');
    } catch (error) {
        res.status(403);
        throw new Error(error.message);
    }

    if (!text || typeof text !== 'string' || text.trim() === '') {
        res.status(400);
        throw new Error("Comment text is required");
    }

    const comment = {
        user: req.user._id,
        text: text.trim(),
        line: line || null,
        createdAt: new Date(),
    };

    file.comments.push(comment);
    file.lastModifiedBy = req.user._id;

    const updatedFile = await file.save();

    const populatedFile = await File.findById(updatedFile._id)
        .populate("creator", "name username avatar")
        .populate("lastModifiedBy", "name username avatar")
        .populate("parent", "name path")
        .populate("comments.user", "name username avatar");

    res.status(201).json(populatedFile);
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const file = await File.findById(req.params.fileId);
    if (!file) {
        res.status(404);
        throw new Error("File not found");
    }

    try {
        await checkProjectAccess(file.project.toString(), req.user?._id || null, 'editor');
    } catch (error) {
        res.status(403);
        throw new Error(error.message);
    }

    const comment = file.comments.id(commentId);
    if (!comment) {
        res.status(404);
        throw new Error("Comment not found");
    }

    file.comments.pull(commentId);
    await file.save();

    res.json({ message: "Comment deleted successfully" });
});

const searchFiles = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { query, type, language } = req.query;

    try {
        await checkProjectAccess(projectId, req.user?._id || null, 'viewer');
    } catch (error) {
        res.status(403);
        throw new Error(error.message);
    }

    let searchQuery = { project: projectId };

    if (query) {
        searchQuery.$or = [
            { name: { $regex: query, $options: 'i' } },
            { content: { $regex: query, $options: 'i' } }
        ];
    }

    if (type) searchQuery.type = type;
    if (language) searchQuery.language = language;

    const files = await File.find(searchQuery)
        .populate("creator", "name username avatar")
        .populate("lastModifiedBy", "name username avatar")
        .sort({ updatedAt: -1 })
        .limit(100);

    res.status(200).json(files);
});

module.exports = {
    createFile,
    getProjectFiles,
    getFileTree,
    getFile,
    updateFile,
    deleteFile,
    moveFile,
    addComment,
    deleteComment,
    searchFiles,
};