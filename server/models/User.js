const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        maxlength: [50, 'Full name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false // Don't include password in queries by default
    },
    role: {
        type: String,
        enum: ['employee', 'hr', 'admin', 'superadmin'],
        default: 'employee'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLogin: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    try {
        // Hash password with cost of 12
        const hashedPassword = await bcrypt.hash(this.password, 12);
        this.password = hashedPassword;
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method to check if password matches
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get user data without sensitive information
userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.resetPasswordToken;
    delete userObject.resetPasswordExpires;
    return userObject;
};

// Static method to find user by email
userSchema.statics.findByEmail = function (email) {
    return this.findOne({ email: email.toLowerCase() });
};

// Static method to check if email exists
userSchema.statics.emailExists = async function (email) {
    const user = await this.findOne({ email: email.toLowerCase() });
    return !!user;
};

module.exports = mongoose.model('User', userSchema);
