import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a base64 data URI to Cloudinary.
 * Returns the secure URL of the uploaded image.
 */
export async function uploadImage(
  base64DataUri: string,
  folder = "artes-dan"
): Promise<string> {
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
 * Returns array of secure URLs.
 */
export async function uploadImages(
  base64DataUris: string[],
  folder = "artes-dan"
): Promise<string[]> {
  const results = await Promise.all(
    base64DataUris.map((uri) => uploadImage(uri, folder))
  );
  return results;
}

/**
 * Delete an image from Cloudinary by URL.
 */
export async function deleteImage(url: string): Promise<void> {
  // Extract public_id from URL
  const parts = url.split("/");
  const folderAndFile = parts.slice(parts.indexOf("artes-dan")).join("/");
  const publicId = folderAndFile.replace(/\.[^/.]+$/, "");
  if (publicId) {
    await cloudinary.uploader.destroy(publicId);
  }
}

export default cloudinary;
