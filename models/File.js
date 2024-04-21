// models/File.js
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    fileId: {
        type: String,
        required: true,
        unique: true // Ensure fileId is unique
    },
    name: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    contentType: {
        type: String,
        required: true
    },
    fileOwner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the user who owns the file
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the user who created the file
        required: true
    },
    directory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Directory', // Reference to the directory where the file belongs
//        required: true
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

// Middleware to generate fileId based on MongoDB's unique _id
fileSchema.pre('save', function(next) {
    if (!this.fileId) {
        this.fileId = this._id.toString(); // Assign _id to fileId if not already set
    }
    next();
});


module.exports = mongoose.model('File', fileSchema);
