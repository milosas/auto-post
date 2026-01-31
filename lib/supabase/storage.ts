import { createClient } from '@supabase/supabase-js';

/**
 * Upload a DALL-E image to Supabase Storage
 *
 * DALL-E URLs expire in 60 minutes, so we must immediately download
 * and upload to permanent Supabase Storage.
 *
 * @param dalleUrl - The temporary DALL-E image URL
 * @param userId - The user ID (for organizing files by user)
 * @param fileId - Unique file identifier (typically post ID or UUID)
 * @returns The permanent public URL in Supabase Storage
 */
export async function uploadDalleImage(
  dalleUrl: string,
  userId: string,
  fileId: string
): Promise<string> {
  try {
    // Create Supabase client with service role key for server-side uploads
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Fetch the image from DALL-E URL
    const response = await fetch(dalleUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch DALL-E image: ${response.status} ${response.statusText}`);
    }

    // Convert response to blob
    const blob = await response.blob();

    // Generate unique filename with timestamp
    const filename = `${userId}/${fileId}-${Date.now()}.png`;

    // Upload to 'post-images' bucket
    const { data, error } = await supabase.storage
      .from('post-images')
      .upload(filename, blob, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase Storage upload error:', error);
      throw new Error(`Failed to upload image to storage: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('post-images')
      .getPublicUrl(data.path);

    console.log(`Successfully uploaded DALL-E image to: ${publicUrl}`);

    return publicUrl;
  } catch (error) {
    console.error('Error in uploadDalleImage:', error);
    throw error;
  }
}
