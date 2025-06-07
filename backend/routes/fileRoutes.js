const express = require('express');
const router = express.Router();
const {
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
} = require('../controller/fileController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

// Project files and tree
router.get('/project/:projectId', protect, optionalAuth, getProjectFiles);
router.get('/project/:projectId/tree', optionalAuth, getFileTree);

// Create file
router.post('/', protect, createFile);

// File operations (standardize to :fileId everywhere)
router.get('/:fileId', protect, getFile);
router.put('/:fileId', protect, updateFile);
router.delete('/:fileId', protect, deleteFile);

router.post('/:fileId/move', protect, moveFile);

// Comments
router.post('/:fileId/comment', protect, addComment);
router.delete('/:fileId/comment/:commentId', protect, deleteComment);

// Search
router.get('/project/:projectId/search', optionalAuth, searchFiles);

module.exports = router;