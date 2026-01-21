import { getSupabaseAdmin, isSupabaseConfigured } from '../supabase';

const BUCKET_NAME = 'islandloaf-images';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function uploadImage(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  folder: string = 'services'
): Promise<UploadResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const supabase = getSupabaseAdmin();
    
    const ext = filename.split('.').pop() || 'jpg';
    const uniqueFilename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(uniqueFilename, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return { success: false, error: error.message };
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch (err: any) {
    console.error('Image upload error:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteImage(url: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const supabase = getSupabaseAdmin();
    
    const path = url.split(`${BUCKET_NAME}/`)[1];
    if (!path) return false;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error('Supabase delete error:', error);
      return false;
    }

    return true;
  } catch (err: any) {
    console.error('Image delete error:', err);
    return false;
  }
}

export async function ensureBucketExists(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, skipping bucket creation');
    return false;
  }

  try {
    const supabase = getSupabaseAdmin();
    
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      });

      if (error) {
        console.error('Failed to create bucket:', error);
        return false;
      }
      console.log(`Created storage bucket: ${BUCKET_NAME}`);
    }

    return true;
  } catch (err: any) {
    console.error('Bucket check error:', err);
    return false;
  }
}
