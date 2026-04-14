const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BUCKETS = {
  templates: 'zanxa-templates',
  projects: 'zanxa-projects',
  courses: 'zanxa-courses',
  thumbnails: 'zanxa-thumbnails',
};

const uploadFile = async (bucket, filePath, fileBuffer, mimetype) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType: mimetype,
      upsert: true,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return urlData.publicUrl;
};

const getSignedUrl = async (bucket, filePath, expiresIn = 3600) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresIn);

  if (error) throw new Error(`Signed URL failed: ${error.message}`);
  return data.signedUrl;
};

const deleteFile = async (bucket, filePath) => {
  const { error } = await supabase.storage.from(bucket).remove([filePath]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
};

module.exports = { supabase, uploadFile, getSignedUrl, deleteFile, BUCKETS };
