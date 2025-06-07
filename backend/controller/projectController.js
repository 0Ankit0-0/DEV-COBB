const Project = require('../models/project');
const User = require('../models/user');
const asyncHandler = require('express-async-handler');

const createProject = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        isPublic,
        tags,
        template,
        thumbnail,
        languageUsed
    } = req.body;

    if (!name || !description) {
        res.status(400);
        throw new Error('Project name and description are required');
    }

    const project = await Project.create({
        name,
        description,
        isPublic: isPublic || false,
        tags: tags || [],
        template: template || null,
        languageUsed: languageUsed || null,
        thumbnail: thumbnail || null,
        owner: req.user._id
    });

    const populatedProject = await Project.findById(project._id)
        .populate('owner', 'name username avatar')
        .populate('collaborators.user', 'name username avatar');

    res.status(201).json(populatedProject);
});

const getProjects = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { search, tags, sortBy, languageUsed } = req.query || '';

    let query = {};
    let sort = {};

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { tags: { $regex: search, $options: "i" } },
        ];
    }

    if (languageUsed) {
        query.languageUsed = languageUsed;
    }

    if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        query.tags = { $in: tagArray };
    }

    if (req.user) {
        query.$or = [
            { isPublic: true },
            { owner: req.user._id },
            { "collaborators.user": req.user._id },
        ];
    } else {
        query.isPublic = true;
    }

    switch (sortBy) {
        case 'newest':
            sort = { createdAt: -1 };
            break;
        case 'oldest':
            sort = { createdAt: 1 };
            break;
        case 'most-liked':
            sort = { likes: -1 };
            break;
        case 'least-liked':
            sort = { likes: 1 };
            break;
        default:
            sort = { createdAt: -1 };
    }

    const projects = await Project.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('owner', 'name username avatar')
        .populate('collaborators.user', 'name username avatar');

    const totalProjects = await Project.countDocuments(query);

    res.json({
        projects,
        totalProjects,
        totalPages: Math.ceil(totalProjects / limit),
        currentPage: page
    });
});

const getProject = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id)
        .populate('owner', 'name username avatar')
        .populate('collaborators.user', 'name username avatar')
        .populate('likes', 'name username avatar');

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    if (!project.isPublic && project.owner.toString() !== req.user._id.toString() &&
        !project.collaborators.some(collab => collab.user.toString() === req.user._id.toString())
    ) {
        res.status(403);
        throw new Error('You do not have permission to view this project');
    }

    // Increment analytics
    if (project.analytics && project.analytics.views !== undefined) {
        project.analytics.views += 1;
        project.analytics.lastOpened = new Date();
        await project.save();
    }

    res.json(project);
});

const updateProject = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isCollaborator = project.collaborators.some(
        (collab) => collab.user.toString() === req.user._id.toString() && (collab.role === 'editor' || collab.role === 'admin')
    );

    if (!isOwner && !isCollaborator) {
        res.status(403);
        throw new Error('You do not have permission to update this project');
    }

    const {
        name,
        description,
        isPublic,
        tags,
        template,
        thumbnail,
        languageUsed
    } = req.body;

    project.name = name || project.name;
    project.description = description || project.description;
    project.isPublic = typeof isPublic === "boolean" ? isPublic : project.isPublic;
    project.tags = tags || project.tags;
    project.template = template || project.template;
    project.languageUsed = languageUsed || project.languageUsed;
    project.thumbnail = thumbnail || project.thumbnail;

    const updatedProject = await project.save();

    const populatedProject = await Project.findById(updatedProject._id)
        .populate('owner', 'name username avatar')
        .populate('collaborators.user', 'name username avatar');

    res.json(populatedProject);
});

const deleteProject = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    if (project.owner.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('You do not have permission to delete this project');
    }

    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project deleted successfully' });
});

const addCollaborator = asyncHandler(async (req, res) => {
    const { userId, role } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isCollaborator = project.collaborators.some(
        (collab) => collab.user.toString() === req.user._id.toString() && collab.role === 'admin'
    );

    if (!isOwner && !isCollaborator) {
        res.status(403);
        throw new Error('You do not have permission to add collaborators to this project');
    }

    const user = await User.findById(userId);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const existingCollaborator = project.collaborators.find(
        (collab) => collab.user.toString() === userId
    );
    if (existingCollaborator) {
        res.status(400);
        throw new Error('User is already a collaborator on this project');
    }

    project.collaborators.push({
        user: userId,
        role: role || 'viewer'
    });

    await project.save();

    const updatedProject = await Project.findById(req.params.id)
        .populate('owner', 'name username avatar')
        .populate('collaborators.user', 'name username avatar');

    res.json(updatedProject);
});

const removeCollaborator = asyncHandler(async (req, res) => {
    const { collaboratorId } = req.params;
    const project = await Project.findById(req.params.id);

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isCollaborator = project.collaborators.some(
        (collab) => collab.user.toString() === req.user._id.toString() && collab.role === 'admin'
    );

    if (!isOwner && !isCollaborator) {
        res.status(403);
        throw new Error('You do not have permission to remove collaborators from this project');
    }

    project.collaborators = project.collaborators.filter(
        (collab) => collab.user.toString() !== collaboratorId
    );

    await project.save();

    const updatedProject = await Project.findById(req.params.id)
        .populate('owner', 'name username avatar')
        .populate('collaborators.user', 'name username avatar');

    res.json(updatedProject);
});

const updateCollaboratorRole = asyncHandler(async (req, res) => {
    const { collaboratorId } = req.params;
    const { role } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isCollaborator = project.collaborators.some(
        (collab) => collab.user.toString() === req.user._id.toString() && collab.role === 'admin'
    );
    if (!isOwner && !isCollaborator) {
        res.status(403);
        throw new Error('You do not have permission to update collaborator roles in this project');
    }

    const collaborator = project.collaborators.find(
        (collab) => collab.user.toString() === collaboratorId
    );
    if (!collaborator) {
        res.status(404);
        throw new Error('Collaborator not found in this project');
    }

    collaborator.role = role || 'viewer';
    await project.save();

    const updatedProject = await Project.findById(req.params.id)
        .populate('owner', 'name username avatar')
        .populate('collaborators.user', 'name username avatar');

    res.json(updatedProject);
});

const toggleLikeProject = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    const isLiked = project.likedBy && project.likedBy.includes(req.user._id);

    if (isLiked) {
        project.likedBy = project.likedBy.filter(
            userId => userId.toString() !== req.user._id.toString()
        );
        project.likes = (project.likes || 1) - 1;
    } else {
        project.likedBy.push(req.user._id);
        project.likes = (project.likes || 0) + 1;
    }

    await project.save();

    res.json({
        liked: isLiked ? 'Project unliked' : 'Project liked',
        likes: project.likes
    });
});

const getUserProjects = asyncHandler(async (req, res) => {
    const userId = req.params.userId || req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    let query = { owner: userId };
    if (!req.user || req.user._id.toString() !== userId.toString()) {
        query.isPublic = true;
    }

    const projects = await Project.find(query)
        .skip(skip)
        .limit(limit)
        .populate('owner', 'name username avatar')
        .populate('collaborators.user', 'name username avatar');

    const totalProjects = await Project.countDocuments(query);

    res.json({
        projects,
        totalProjects,
        totalPages: Math.ceil(totalProjects / limit),
        currentPage: page
    });
});

const getProjectAnalytics = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isCollaborator = project.collaborators.some(
        (collab) => collab.user.toString() === req.user._id.toString() && collab.role === 'admin'
    );

    if (!isOwner && !isCollaborator) {
        res.status(403);
        throw new Error('You do not have permission to view analytics for this project');
    }

    res.json({
        analytics: project.analytics,
        likes: project.likes,
        views: project.analytics ? project.analytics.views : 0,
        collaborators: project.collaborators.map(collab => ({
            user: collab.user,
            role: collab.role
        })),
        isPublic: project.isPublic,
    });
});

const forkProject = asyncHandler(async (req, res) => {
    const originalProject = await Project.findById(req.params.id);

    if (!originalProject) {
        res.status(404);
        throw new Error('Original project not found');
    }

    if (!originalProject.isPublic) {
        const hasAcess =
            originalProject.owner.toString() === req.user._id.toString() ||
            originalProject.collaborators.some(
                (collab) => collab.user.toString() === req.user._id.toString()
            );

        if (!hasAcess) {
            res.status(403);
            throw new Error('You do not have permission to fork this project');
        }
    }

    const forkedProject = await Project.create({
        name: `${originalProject.name} (Forked)`,
        description: originalProject.description,
        isPublic: false,
        tags: originalProject.tags,
        template: originalProject.template,
        languageUsed: originalProject.languageUsed,
        thumbnail: originalProject.thumbnail,
        owner: req.user._id,
        collaborators: originalProject.collaborators.map(collab => ({
            user: collab.user,
            role: collab.role
        })),
        likes: 0,
        likedBy: [],
        analytics: {
            views: 0,
            lastOpened: null
        }
    });

    const populatedProject = await Project.findById(forkedProject._id)
        .populate('owner', 'name username avatar');

    res.status(201).json(populatedProject);
});

module.exports = {
    createProject,
    getProjects,
    getProject,
    updateProject,
    deleteProject,
    addCollaborator,
    removeCollaborator,
    updateCollaboratorRole,
    toggleLikeProject,
    getUserProjects,
    getProjectAnalytics,
    forkProject
};