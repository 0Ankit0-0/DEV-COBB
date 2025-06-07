const express = require('express');
const router = express.Router();

const {
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
    forkProject,
} = require('../controller/projectController');

const { protect, optionalAuth } = require('../middleware/authMiddleware');

// Project list and creation
router.get('/', optionalAuth, getProjects);
router.get('/user/:userId', protect, getUserProjects);
router.get('/:id', optionalAuth, getProject);
router.post('/', protect, createProject);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);

// Collaborators
router.post('/:id/collaborators', protect, addCollaborator);
router.delete('/:id/collaborators/:collaboratorId', protect, removeCollaborator);
router.put('/:id/collaborators/:collaboratorId/role', protect, updateCollaboratorRole);

// Likes, forks, analytics
router.post('/:id/like', protect, toggleLikeProject);
router.post('/:id/fork', protect, forkProject);
router.get('/:id/analytics', protect, getProjectAnalytics);

module.exports = router;