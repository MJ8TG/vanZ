import { datasql as supabase } from "./datasql";

/**
 * Uploads a file to a Supabase Storage bucket.
 * @param bucket The name of the bucket (e.g., 'driver-documents')
 * @param filePath The path within the bucket (e.g., 'userId/filename.jpg')
 * @param file The file object (Blob or File)
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(bucket: string, filePath: string, file: Blob | File) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      upsert: true,
      cacheControl: '3600',
    });

  if (error) {
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
}
