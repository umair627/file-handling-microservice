//Contains model files that define the structure of your data and provide an interface for interacting with the database.

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    storageUsage: {
        type: Number,
        default: 0
    },
    bandwidthUsage: {
        type: Number,
        default: 0
    },
    bandwidthLastReset: {
        type: Date,
        default: Date.now
    },
    lastLoginTime: {
        type: Date,
        default: Date.now
    },
    active: {
        type: Boolean,
        default: true
    },
    isAdmin: {
        type: Boolean,
        default: false // By default, users are not admins
    }
});

module.exports = mongoose.model('User', userSchema);
