// storageService.js
const User = require('../models/user');
const File = require('../models/File');
const Directory=require('../models/Directory');
const fs = require('fs').promises;
const path = require('path');
const azure = require('azure-storage');



class FileService {
    constructor(connectionString, containerName) {
      this.blobService = azure.createBlobService(connectionString);
      this.containerName = containerName;
    }
  
    async uploadFiles(files) {
      try {
        const uploadedFiles = [];
        for (const file of files) {
          const fileNameWithTimestamp = this.generateFileNameWithTimestamp(file.originalname);
          const stream = this.getStream(file.buffer);
          await this.uploadToBlobStorage(fileNameWithTimestamp, stream, file.size);
          uploadedFiles.push(fileNameWithTimestamp);
        }
        return uploadedFiles;
      } catch (error) {
        throw new Error(`Error uploading files: ${error.message}`);
      }
    }
  
    generateFileNameWithTimestamp(originalFileName) {
      const timestamp = Date.now();
      return `${originalFileName}_${timestamp}`;
    }
  
    uploadToBlobStorage(fileName, stream, size) {
      return new Promise((resolve, reject) => {
        this.blobService.createBlockBlobFromStream(this.containerName, fileName, stream, size, (error, result, response) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }
  
    getStream(buffer) {
      const Duplex = require('stream').Duplex;
      const stream = new Duplex();
      stream.push(buffer);
      stream.push(null);
      return stream;
    }
  }

async function viewFilesInDirectory(directoryPath) {
    try {
        // Read the contents of the directory
        const files = await fs.readdir(directoryPath);

        // Filter out directories (if needed)
        const fileList = await Promise.all(files.map(async (file) => {
            const filePath = path.join(directoryPath, file);
            const fileStats = await fs.stat(filePath);
            return {
                name: file,
                type: fileStats.isDirectory() ? 'directory' : 'file',
                size: fileStats.size,
                // You can include more file metadata here
            };
        }));

        return fileList;
    } catch (error) {
        throw new Error(`Error reading directory: ${error.message}`);
    }
}

async function getStorageUsage(userId) {
    const user = await User.findById(userId);
    return user.storageUsage;
}

async function updateStorageUsage(userId, newStorageUsage) {
    await User.findByIdAndUpdate(userId, { storageUsage: newStorageUsage });
}

async function saveFile(file) {
    try {
        // Save file to the current directory (customize as per your requirement)
        const uploadPath = `${__dirname}/uploads/${file.name}`;
        await file.mv(uploadPath);

        return { filename: file.name, size: file.size, path: uploadPath };
    } catch (error) {
        // Log the specific error caught from file.mv()
        console.error('Error saving file:', error);
        throw new Error(`Failed to save file: ${error.message}`);
    }
}

async function saveFileMetadata(metadata) {
    try {
        const newFile = new File(metadata);
        return await newFile.save();
    } catch (error) {
        throw new Error('Failed to save file metadata');
    }
}

async function updateStorageUsage(userId, fileSize) {
    try {
        // Find user and update storage usage
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Calculate new storage usage
        const newStorageUsage = user.storageUsage + fileSize;

        // Update user's storage usage
        user.storageUsage = newStorageUsage;
        await user.save();
    } catch (error) {
        throw new Error('Failed to update storage usage');
    }
}

async function createDirectory(name, parentDirectoryId, userId) {
    try {
      // Create a new directory object
      const newDirectory = new Directory({
        name,
        parentDirectory: parentDirectoryId, // If parentDirectoryId is not provided, it will be null
        user: userId, // Assuming userId is the owner of the directory
      });
  
      // Save the new directory to the database
      const directory = await newDirectory.save();
  
      return directory;
    } catch (error) {
      throw error; // Propagate error to the controller
    }
  };
  

async function deleteDirectory (directoryId, userId){
    try {
        // Ensure the directory belongs to the user before deleting
        await Directory.findOneAndDelete({ _id: directoryId, user: userId });
    } catch (error) {
        throw error;
    }
};

async function viewFileContent(fileId) {
    // Find the file
    const file = await File.findById(fileId);
    if (!file) {
        throw new Error('File not found');
    }

    // Return the file content
    return file.content;
}

// Implement other storage management functions...
module.exports = {
    saveFile,
    saveFileMetadata,
    updateStorageUsage,
    viewFilesInDirectory,
    createDirectory,
    deleteDirectory,
    viewFileContent,
    FileService
};
