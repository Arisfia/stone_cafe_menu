import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase/client";

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageBytes = 5 * 1024 * 1024;

export function validateImageFile(file: File) {
  if (!allowedTypes.includes(file.type)) return "Use a JPG, PNG, or WebP image.";
  if (file.size > maxImageBytes) return "Images must be 5 MB or smaller.";
  return null;
}

export async function uploadImage(path: string, file: File, onProgress?: (progress: number) => void) {
  const storage = getFirebaseStorage();
  if (!storage) throw new Error("Firebase Storage is not configured.");

  const error = validateImageFile(file);
  if (error) throw new Error(error);

  const extension = file.name.split(".").pop()?.toLowerCase() || "webp";
  const storageRef = ref(storage, `${path}/${crypto.randomUUID()}.${extension}`);
  const task = uploadBytesResumable(storageRef, file, { contentType: file.type });

  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => onProgress?.(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
      reject,
      () => resolve()
    );
  });

  return {
    imagePath: task.snapshot.ref.fullPath,
    imageUrl: await getDownloadURL(task.snapshot.ref)
  };
}

export async function removeImage(path?: string) {
  const storage = getFirebaseStorage();
  if (!storage || !path) return;
  await deleteObject(ref(storage, path));
}
