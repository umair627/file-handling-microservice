
// storageRoutes.js
const { verifyToken } = require('../middlewares/authMiddleware');
//const { upload,multerAzureStorage } = require('../middlewares/StorageMgmtMiddleware'); // Import Multer upload middleware
const storageController = require('../controllers/storageController');
const express = require('express');
const User = require('../models/user');


const router = express.Router();

// Apply authentication middleware to all storage routes
router.use(verifyToken);

// Route for handling file uploads
//router.post('/upload-file', upload.array('files'),storageController.handleFileUpload);
/*
router.post('/upload-file', uploadAzure.array('files'), (req, res) => {
    const fileUrls = req.files.map(file => ({
        originalname: file.originalname,
        path: `https://${req.storageAccount}.blob.core.windows.net/${req.container}/${file.originalname}`,
    }));
    res.json({ message: 'Files uploaded successfully', fileUrls });
}); */

// Express route for multiple file upload
router.post('/upload-file', storageController.uploadFiles);
// Other routes for file management
router.delete('/delete-file/:fileId', storageController.deleteFile);
router.get('/list-files', storageController.listDirectory);
router.get('/view-files', storageController.viewFiles);
router.post('/create-directory', verifyToken,storageController.createDirectory);
router.delete('/delete-directory', storageController.deleteDirectory);
router.get('/view-file', storageController.viewFileContent);

module.exports = router;

