const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/email');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback-secret', {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
};

// Set JWT Cookie
const setTokenCookie = (res, token) => {
    // Parse JWT_EXPIRES_IN to get days
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const days = parseInt(expiresIn.replace('d', '')) || 7;

    const cookieOptions = {
        expires: new Date(
            Date.now() + days * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
    };

    res.cookie('token', token, cookieOptions);
};

// Clear JWT Cookie
const clearTokenCookie = (res) => {
    res.cookie('token', '', {
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create new user (role defaults to 'employee')
        const user = await User.create({
            fullName,
            email,
            password
        });

        // Generate token
        const token = generateToken(user._id);

        // Set cookie
        setTokenCookie(res, token);

        // Send welcome email (non-blocking)
        sendWelcomeEmail(email, fullName).catch(console.error);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: user.toJSON(),
                token
            }
        });
    } catch (error) {
        console.error('Registration error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: messages
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error registering user'
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if email and password are provided
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user and include password for comparison
        const user = await User.findByEmail(email).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact administrator.'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        // Set cookie
        setTokenCookie(res, token);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: user.toJSON(),
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during login'
        });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        res.json({
            success: true,
            data: {
                user: user.toJSON()
            }
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user data'
        });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res) => {
    try {
        // Clear the token cookie immediately
        clearTokenCookie(res);

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during logout'
        });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email address'
            });
        }

        // Find user
        const user = await User.findByEmail(email);
        if (!user) {
            // Don't reveal if user exists or not for security
            return res.json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent.'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Set token expiry (15 minutes)
        const resetPasswordExpires = Date.now() + 15 * 60 * 1000;

        // Save token to user
        user.resetPasswordToken = resetPasswordToken;
        user.resetPasswordExpires = resetPasswordExpires;
        await user.save();

        // Create reset URL
        const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

        try {
            // Send email
            await sendPasswordResetEmail(email, resetToken, resetUrl);

            res.json({
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent.'
            });
        } catch (error) {
            // If email fails, clear the reset token
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            console.error('Email error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error sending password reset email'
            });
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing forgot password request'
        });
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide new password'
            });
        }

        // Hash the token to compare with stored hash
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with valid reset token
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Set new password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        // Generate new token for automatic login
        const newToken = generateToken(user._id);
        setTokenCookie(res, newToken);

        res.json({
            success: true,
            message: 'Password reset successful',
            data: {
                user: user.toJSON(),
                token: newToken
            }
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting password'
        });
    }
};

module.exports = {
    register,
    login,
    getMe,
    logout,
    forgotPassword,
    resetPassword
};
