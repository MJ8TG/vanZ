import { datasql as supabase } from "./datasql";

/**
 * Uploads a file to a private Supabase Storage bucket.
 * Returns the storage path (NOT a URL). Use getSignedUrl() to read.
 * @param bucket The name of the bucket (e.g., 'driver-documents')
 * @param filePath The path within the bucket (e.g., 'userId/filename.jpg')
 * @param file The file object (Blob or File)
 * @returns The path of the uploaded file
 */
export async function uploadFile(bucket: string, filePath: string, file: Blob | File): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      upsert: true,
      cacheControl: '3600',
    });

  if (error) {
    throw error;
  }

  return data.path; // ex: "userId/cinFrontUrl_1234.jpg"
}

/**
 * Generate a temporary signed URL for a private file.
 */
export async function getSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
