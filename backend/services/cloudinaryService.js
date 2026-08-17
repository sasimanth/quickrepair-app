const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'fixvo-demo',
  api_key: process.env.CLOUDINARY_API_KEY || '123456789',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'secret123'
});

const uploadImage = async (fileStr, folder = 'fixvo_jobs') => {
  try {
    if (!fileStr) return null;
    // If already a hosted HTTP/HTTPS URL, return as is
    if (fileStr.startsWith('http://') || fileStr.startsWith('https://')) {
      return fileStr;
    }
    
    // Check if Cloudinary is configured with real credentials
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'fixvo-demo') {
      const uploadResponse = await cloudinary.uploader.upload(fileStr, {
        folder,
        resource_type: 'auto'
      });
      return uploadResponse.secure_url;
    }
    
    return fileStr;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    return fileStr;
  }
};

module.exports = { uploadImage };
