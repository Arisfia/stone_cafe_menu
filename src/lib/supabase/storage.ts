import { SUPABASE_BUCKET, SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/client";

const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};
const maxImageBytes = 10 * 1024 * 1024;

export function validateImageFile(file: File) {
  if (!allowedTypes[file.type]) return "Use a JPG, PNG, WebP, or GIF image.";
  if (file.size > maxImageBytes) return "Images must be 10 MB or smaller.";
  return null;
}

export function imageExtensionForFile(file: File) {
  return allowedTypes[file.type] || file.name.split(".").pop()?.toLowerCase() || "webp";
}

/**
 * Uploads an image to Supabase Storage and returns its public URL + storage
 * path. Uses XHR so the caller gets real upload progress.
 */
export async function uploadImage(path: string, file: File, onProgress?: (progress: number) => void) {
  const baseUrl = SUPABASE_URL;
  const key = SUPABASE_KEY;
  if (!baseUrl || !key) throw new Error("Supabase Storage is not configured.");

  const error = validateImageFile(file);
  if (error) throw new Error(error);

  const extension = imageExtensionForFile(file);
  const objectKey = `${path.replace(/^\/+|\/+$/g, "")}/${crypto.randomUUID()}.${extension}`;
  const endpoint = `${baseUrl}/storage/v1/object/${SUPABASE_BUCKET}/${objectKey}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    xhr.setRequestHeader("authorization", `Bearer ${key}`);
    xhr.setRequestHeader("apikey", key);
    xhr.setRequestHeader("x-upsert", "true");
    xhr.setRequestHeader("cache-control", "3600");
    if (file.type) xhr.setRequestHeader("content-type", file.type);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        reject(new Error(parseError(xhr.responseText) || "Image upload failed."));
      }
    };
    xhr.onerror = () => reject(new Error("Image upload failed."));
    xhr.send(file);
  });

  return {
    imagePath: `${SUPABASE_BUCKET}/${objectKey}`,
    imageUrl: `${baseUrl}/storage/v1/object/public/${SUPABASE_BUCKET}/${objectKey}`
  };
}

/** Deletes an image previously uploaded via `uploadImage`. `path` is `bucket/objectKey`. */
export async function removeImage(path?: string) {
  const baseUrl = SUPABASE_URL;
  const key = SUPABASE_KEY;
  if (!baseUrl || !key || !path) return;
  const response = await fetch(`${baseUrl}/storage/v1/object/${path}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${key}`, apikey: key }
  });
  if (!response.ok) throw new Error(parseError(await response.text()) || "Image delete failed.");
}

function parseError(body: string) {
  try {
    return (JSON.parse(body) as { message?: string; error?: string }).message ?? null;
  } catch {
    return null;
  }
}
