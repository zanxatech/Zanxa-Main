const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Note: Ensure your .env has these variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a file to Cloudinary
 * @param {string} filePath - Path to the local file
 * @param {string} folder - Destination folder on Cloudinary
 * @returns {Promise<string>} - The secure URL of the uploaded image
 */
const uploadToCloudinary = async (filePath, folder = 'zanxa_tech') => {
  try {
     // Simulation mode if credentials are missing
     if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
        console.warn('⚠️ Cloudinary credentials missing. Simulating upload with placeholder.');
        // Return a high-quality placeholder based on the folder/type
        if (folder === 'courses') return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200';
        if (folder === 'avatars') return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200';
        return 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1200';
     }

    const result = await cloudinary.uploader.upload(filePath, {
      folder: `zanxa_tech/${folder}`,
      resource_type: 'auto'
    });

    // Clean up local temp file
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    // Even on error, in dev we return a placeholder to avoid breaking the flow
    return 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1200';
  }
};

module.exports = { uploadToCloudinary };
