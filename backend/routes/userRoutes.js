const express = require('express');
const router = express.Router();
const { registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    updateUserSettings,
    changePassword,
    getUserByUsername,
    searchUsers,
    addFriend,
    removeFriend,
    getAllUsers,
    deleteUser, 
} = require('../controller/userController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(protect, admin, getAllUsers);

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/profile').get(protect, getUserProfile);

router.route('/profile/me').put(protect, updateUserProfile);

router.route('/settings').put(protect, updateUserSettings);

router.route('/password').put(protect, changePassword);
router.route('/me').get(protect, getUserProfile);
router.route('/:username').get(protect, getUserByUsername);

router.route('/search/:query').get(protect, searchUsers);

router.route('/friends/add/:username').post(protect, addFriend);
router.route('/friends/remove/:username').delete(protect, removeFriend);

router.route('/delete').delete(protect, deleteUser);

module.exports = router;