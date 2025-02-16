const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'administrators',
    format: async (req, file) => 'png', // supports promises as well
    public_id: (req, file) => `admin-${Date.now()}`
  }
});

// Multer upload configuration
const upload = multer({ storage: storage });

module.exports = { upload, cloudinary };