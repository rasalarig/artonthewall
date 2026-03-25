import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Check if Cloudinary credentials are fully configured.
 */
function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Upload a base64 data URI to Cloudinary.
 * If Cloudinary is not configured, returns the base64 data URI as-is
 * so it can be stored directly in the database.
 */
export async function uploadImage(
  base64DataUri: string,
  folder = "artes-dan"
): Promise<string> {
  if (!isCloudinaryConfigured()) {
    // No Cloudinary credentials — store base64 directly in DB
    return base64DataUri;
  }

  const result = await cloudinary.uploader.upload(base64DataUri, {
    folder,
    resource_type: "image",
    transformation: [
      { width: 1600, crop: "limit" }, // max 1600px wide
      { quality: "auto:good" },
      { fetch_format: "auto" },
    ],
  });
  return result.secure_url;
}

/**
 * Upload multiple base64 images to Cloudinary.
 * If Cloudinary is not configured, returns the base64 data URIs as-is.
 */
export async function uploadImages(
  base64DataUris: string[],
  folder = "artes-dan"
): Promise<string[]> {
  if (!isCloudinaryConfigured()) {
    return base64DataUris;
  }

  const results = await Promise.all(
    base64DataUris.map((uri) => uploadImage(uri, folder))
  );
  return results;
}

/**
 * Delete an image from Cloudinary by URL.
 * Skips deletion for base64 data URIs (not hosted on Cloudinary).
 */
export async function deleteImage(url: string): Promise<void> {
  // Skip deletion for base64 data URIs — they live in the DB, not Cloudinary
  if (url.startsWith("data:")) {
    return;
  }

  // Extract public_id from URL
  const parts = url.split("/");
  const folderAndFile = parts.slice(parts.indexOf("artes-dan")).join("/");
  const publicId = folderAndFile.replace(/\.[^/.]+$/, "");
  if (publicId) {
    await cloudinary.uploader.destroy(publicId);
  }
}

export default cloudinary;
