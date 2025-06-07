const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/user');

// Middleware to protect routes
const protect = asyncHandler(async (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                res.status(404);
                throw new Error('User not found');
            }
            next();
        } catch (error) {
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    } else {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

const optionalAuth = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded token (optionalAuth):', decoded);

            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                console.log('User not found for id:', decoded.id);
                req.user = null;
            }
        } catch (error) {
            console.error('Token verification failed (optionalAuth):', error.message);
            req.user = null;
        }
    } else {
        req.user = null;
    }

    next();
});

module.exports = { protect, optionalAuth };
