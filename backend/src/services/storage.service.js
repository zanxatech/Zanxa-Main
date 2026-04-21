const cloudinary = require('cloudinary').v2;
const { createClient } = require('@supabase/supabase-js');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Supabase Storage (for Certificates) - with graceful fallback
let supabase = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY // Use service key for admin write access
    );
  }
} catch (error) {
  console.warn('⚠️ Supabase initialization failed:', error.message);
}

/**
 * Upload an image to Cloudinary
 * @param {string} fileStr - Base64 string or file path
 * @param {string} folder - Destination folder name
 * @returns {Promise<string>} - The secure URL of the uploaded image
 */
const uploadToCloudinary = async (fileStr, folder = 'zanxa_general') => {
  try {
    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      folder: `zanxa/${folder}`,
      resource_type: 'auto',
    });
    return uploadResponse.secure_url;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    throw new Error('Image upload failed');
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param {string[]} fileStrings - Array of file strings
 * @param {string} folder 
 */
const uploadMultipleToCloudinary = async (fileStrings, folder) => {
  return Promise.all(fileStrings.map(f => uploadToCloudinary(f, folder)));
};

/**
 * Upload a PDF certificate to Supabase Storage
 * @param {Buffer|Blob} fileBody - The file content
 * @param {string} fileName - Destination filename
 * @returns {Promise<string>} - The public URL
 */
const uploadCertificateToSupabase = async (fileBody, fileName) => {
  try {
    if (!supabase) {
      throw new Error('Supabase is not configured');
    }

    const { data, error } = await supabase.storage
      .from('certificates')
      .upload(`issued/${fileName}`, fileBody, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('certificates')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Supabase Storage Error:', error);
    throw new Error('Certificate upload failed');
  }
};

module.exports = {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  uploadCertificateToSupabase
};
