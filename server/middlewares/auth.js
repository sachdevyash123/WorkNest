const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes - requires authentication
const protect = async (req, res, next) => {
    try {
        let token;

        // Prefer Authorization header over cookie; ignore invalid cookie placeholders
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (
            req.cookies.token &&
            req.cookies.token !== 'none' &&
            req.cookies.token !== 'null' &&
            req.cookies.token !== 'undefined'
        ) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');

        // Get user from token
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Token is not valid. User not found.'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact administrator.'
            });
        }

        // Add user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Authentication error.'
        });
    }
};

// Middleware to check if user has required role(s)
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. ${req.user.role} role is not authorized to access this resource.`
            });
        }

        next();
    };
};

// Specific role checkers
const requireSuperAdmin = authorize('superadmin');
const requireAdmin = authorize('superadmin', 'admin');
const requireHR = authorize('superadmin', 'admin', 'hr');
const requireEmployee = authorize('superadmin', 'admin', 'hr', 'employee');

module.exports = {
    protect,
    authorize,
    requireSuperAdmin,
    requireAdmin,
    requireHR,
    requireEmployee
};
