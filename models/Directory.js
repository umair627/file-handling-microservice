const mongoose = require('mongoose');

const directorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    parentDirectory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Directory', // Reference to the parent directory
        default: null // Set default value to null
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the user who owns the directory
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    // Add other fields as needed
});

module.exports = mongoose.model('Directory', directorySchema);
