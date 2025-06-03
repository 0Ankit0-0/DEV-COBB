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
} = require('../controllers/fileController');
const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/authMiddleware');

router.get('/project/:projectId', protect, optionalAuth, getProjectFiles);
router.get('/project/:projectId/tree', optionalAuth, getFileTree);

router.post('/', protect, createFile);
router.get('/:fileId', protect, getFile);
router.put('/:fileId', protect, updateFile);
router.delete('/:fileId', protect, deleteFile);

router.post('/:fileId/move', protect, moveFile);

router.post('/:fileId/comment', protect, addComment);
router.delete('/:fileId/comment/:commentId', protect, deleteComment);

router.get('/project/:projectId/tree', optionalAuth, searchFiles);

module.exports = router;
