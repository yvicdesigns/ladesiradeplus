import { supabase } from '@/lib/customSupabaseClient';

/**
 * Uploads a file to Supabase Storage
 * @param {File} file - The file object to upload
 * @param {string} bucket - The storage bucket name (default: 'menu-images')
 * @param {string} folder - The folder path (optional)
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
export const uploadImage = async (file, bucket = 'menu-images', folder = '') => {
  if (!file) throw new Error('No file provided');

  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload an image (JPEG, PNG, WEBP, GIF)');
  }

  // Validate file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('File size exceeds 5MB limit');
  }

  // Sanitize filename to prevent issues with special characters
  const fileExt = file.name.split('.').pop();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}_${sanitizedName}.${fileExt}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  console.log(`[Upload] Starting upload to bucket '${bucket}': ${filePath}`);

  const { data, error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error('[Upload] Error:', uploadError);
    if (uploadError.message.includes('Bucket not found')) {
      throw new Error(`Storage bucket '${bucket}' not found. Please contact support.`);
    }
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  console.log(`[Upload] Success! URL: ${publicUrl}`);
  return publicUrl;
};