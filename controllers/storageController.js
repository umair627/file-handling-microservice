// storageController.js

const storageService = require("../services/storageService");
const { storageMiddleware } = require("../middlewares/StorageMgmtMiddleware");
const File = require("../models/File");
const User = require("../models/user");
const Directory = require("../models/Directory");
const multer = require("multer");
const azure = require("azure-storage");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const { BlobServiceClient,StorageSharedKeyCredential,} = require("@azure/storage-blob");
const { Console } = require("console");
const AZURE_STORAGE_CONNECTION_STRING =
  "DefaultEndpointsProtocol=https;AccountName=userstorage001;AccountKey=OAZrGwge690+aCeJFh/ZQ5FlDVOs2WYA18zWgRTMAwi/Gb+vA/h7zt/dlFWbOLBDi8m/ziOXpE5a+AStr0vEcg==;EndpointSuffix=core.windows.net";
const blobServiceClient = BlobServiceClient.fromConnectionString(
  AZURE_STORAGE_CONNECTION_STRING
);
const containerName = "uploads"; // Replace with your container name
const containerClient = blobServiceClient.getContainerClient(containerName);

// Multer configuration for handling multiple files
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).array("files", 5); // 'files' is the field name for multiple files, 5 is the maximum number of files
const connectionString =
  "DefaultEndpointsProtocol=https;AccountName=userstorage001;AccountKey=OAZrGwge690+aCeJFh/ZQ5FlDVOs2WYA18zWgRTMAwi/Gb+vA/h7zt/dlFWbOLBDi8m/ziOXpE5a+AStr0vEcg==;EndpointSuffix=core.windows.net";
const blobService = azure.createBlobService(connectionString);
function getStream(buffer) {
  const Duplex = require("stream").Duplex;
  const stream = new Duplex();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

async function uploadFiles(req, res) {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).send("Error uploading files.");
    }

    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).send("No files uploaded.");
    }

    try {
      for (const file of files) {
        const timestamp = Date.now(); // Get current timestamp
        const originalFileName = file.originalname;
        const fileNameWithTimestamp = `${originalFileName}_${timestamp}`;
        const stream = getStream(file.buffer);

        // Upload file to Azure Blob Storage
        await new Promise((resolve, reject) => {
          blobService.createBlockBlobFromStream(
            containerName,
            fileNameWithTimestamp,
            stream,
            file.size,
            async (error, result, response) => {
              if (error) {
                console.error(error);
                return reject(
                  `Error uploading file ${originalFileName} to Azure Blob Storage.`
                );
              }
              console.log('File Info:',file)

              // Save file metadata to database
              const newFile = new File({
                fileId: new mongoose.Types.ObjectId(), // Generate a unique ObjectId for the fileId
                name: fileNameWithTimestamp,
                size: file.size,
                contentType: file.mimetype,
                createdBy: req.user.id, // Assuming user ID is stored in req.user.id
                fileOwner: req.user.id, // Assuming file owner is the same as the user who created the file
                directory: req.body.directoryId || null, // If directoryId is not provided, set it to null
              });
              await newFile.save();

              resolve();
            }
          );
        });
      }

      return res.status(200).json({ message: "All files uploaded to Azure Blob Storage." });
    } catch (error) {
      console.error("Error uploading files:", error);
      return res.status(500).send("Internal server error.");
    }
  });
}

async function getStorageUsage(req, res) {
  try {
    const userId = req.user.userId;
    const storageUsage = await storageService.getStorageUsage(userId);
    res.json({ storageUsage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function viewFiles(req, res) {
  try {
    const directoryPath = req.query.directoryPath; // Assuming the directory path is sent in the query parameter
    const fileList = await storageService.viewFilesInDirectory(directoryPath);
    res.status(200).json({ files: fileList });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createDirectory(req, res) {
  try {
    const { name, parentDirectoryId } = req.body;
    const userId = req.user.id; // Assuming user ID is stored in req.user.id

    console.log('userId',userId);
    console.log('name',name);
    console.log('parentDirectoryId',parentDirectoryId);
    // Call service function to create directory
    const directory = await storageService.createDirectory(name, parentDirectoryId || null, userId);

    res.status(201).json(directory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const deleteDirectory = async (req, res) => {
  try {
    const directoryId = req.params.directoryId;
    const userId = req.user.id;

    await directoryService.deleteDirectory(directoryId, userId);
    res.status(200).json({ message: "Directory deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

async function deleteFile(req, res) {
  try {
    // Get the fileId of the file to be deleted from the request parameters
    const fileId = req.params.fileId;
//    const fileId = req.fileId;
    console.log('req.params.fileId',req.params.fileId)
    // Check if the fileId is valid
    console.log('FileID',fileId);
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).send('Invalid fileId.');
    }

    // Find the file by fileId
    const file = await File.findById(fileId);

    // Check if the file exists
    if (!file) {
      return res.status(404).send('File not found.');
    }

    // Check if the deleting user is the owner of the file
    if (file.fileOwner.toString() !== req.user.id) {
      return res.status(403).send('Unauthorized: You do not have permission to delete this file.');
    }

    // Delete the file from Azure Blob Storage
    await new Promise((resolve, reject) => {
      blobService.deleteBlobIfExists(containerName, file.name, (error, result, response) => {
        if (error) {
          console.error(error);
          return reject('Error deleting file from Azure Blob Storage.');
        }
        resolve();
      });
    });

    // Delete the file from the database
    await File.deleteOne({ _id: fileId });

    return res.status(200).send('File deleted successfully.');
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).send('Internal server error.');
  }
}

async function listDirectory(req, res) {
  try {
    let directoryId = req.query.directoryId ?? null;
    let directory;
    // If directoryId is not provided, set directoryId to null
    if (!directoryId) {
      directory = await Directory.find({ parentDirectory: null, user: req.user.id });
    }
    else{
       directory = await Directory.findById(directoryId);4
    }
    console.log('Directory:',directory);
    // Find the directory with the specified ID
    //const directory = await Directory.findById(directoryId);
    
    // Query files and directories belonging to the specified directory and the authenticated user
    let files;
    let directories;

    if (directoryId) {
      files = await File.find({ directory: directoryId, fileOwner: req.user.id }).populate('fileOwner', 'username');
      directories = await Directory.find({ parentDirectory: directoryId, user: req.user.id });
    } else {
      // If directoryId is not provided, query all directories with parentDirectory=null and user=req.user.id
      files = await File.find({ directory: null, fileOwner: req.user.id }).populate('fileOwner', 'username');
      directories = await Directory.find({ parentDirectory: null, user: req.user.id });
    }
    console.log('directories:',directories);
    console.log('files:',files);
    // Construct the response object
    const directoryContents = {
      directory: {
        id: directory._id,
        name: directory.name,
        createdAt: directory.createdAt,
        updatedAt: directory.updatedAt,
      },
      files,
      directories,
    };

    // Send the response
    res.status(200).json(directoryContents);
  } catch (error) {
    console.error('Error listing directory contents:', error);
    res.status(500).json({ message: 'Server Error' });
  }
}



async function viewFileContent(req, res) {
  try {
    const fileId = req.params.fileId; // Assuming file ID is sent as a route parameter
    const fileContent = await storageService.viewFileContent(fileId);
    res.status(200).send(fileContent); // Sending file content as response
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Controller function to retrieve a specific file
async function getFile(req, res) {
  try {
    const fileId = req.params.fileId; // Assuming fileId is passed as a parameter in the request
    // Fetch the file from the database
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }
    // Here you can send the file data or metadata as the response
    res.status(200).json(file);
  } catch (error) {
    console.error("Error fetching file:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  getStorageUsage,
  deleteFile,
  listDirectory,
  viewFileContent,
  viewFiles,
  createDirectory,
  deleteDirectory,
  uploadFiles,
};
