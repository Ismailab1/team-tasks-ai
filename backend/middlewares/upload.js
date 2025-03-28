const { BlobServiceClient } = require('@azure/storage-blob');
const multer = require('multer');
const stream = require('stream');
require('dotenv').config();

const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_BLOB_CONNECTION_STRING);
const containerName = process.env.AZURE_BLOB_CONTAINER || 'uploads';

// Middleware to handle file uploads to Azure Blob Storage
const storage = multer.memoryStorage(); // Store files in memory temporarily
const upload = multer({ storage });

async function uploadToBlobStorage(file) {
  const containerClient = blobServiceClient.getContainerClient(containerName);

  // Ensure the container exists
  await containerClient.createIfNotExists();

  const blobName = `${Date.now()}-${file.originalname}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  const bufferStream = new stream.PassThrough();
  bufferStream.end(file.buffer);

  await blockBlobClient.uploadStream(bufferStream, file.buffer.length, undefined, {
    blobHTTPHeaders: { blobContentType: file.mimetype },
  });

  return blockBlobClient.url; // Return the URL of the uploaded file
}

module.exports = { upload, uploadToBlobStorage };