"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminErrorText } from "@/components/admin/admin-preferences";
import { hasFirebaseClientConfig } from "@/lib/firebase/client";
import { uploadImage, validateImageFile } from "@/lib/firebase/storage";

export function ImageUploadField({
  label,
  text,
  path,
  imageUrl,
  onUploaded
}: {
  label: string;
  text?: Record<string, string>;
  path: string;
  imageUrl?: string;
  onUploaded: (result: { imageUrl: string; imagePath: string }) => void;
}) {
  const [preview, setPreview] = useState(imageUrl || "");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    const validation = validateImageFile(file);
    if (validation) {
      setError(validation);
      return;
    }
    setPreview(URL.createObjectURL(file));
    try {
      const result = await uploadImage(path, file, setProgress);
      onUploaded(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : text?.imageUploadFailed || "Image upload failed.");
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="h-32 w-full rounded-md border object-cover" />
      ) : null}
      <div className="flex items-center gap-2">
        <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleChange} disabled={!hasFirebaseClientConfig()} />
        <Button type="button" variant="outline" size="icon" aria-label={text?.uploadImage || "Upload image"} disabled>
          <Upload className="h-4 w-4" aria-hidden />
        </Button>
      </div>
      {progress > 0 && progress < 100 ? (
        <p className="text-sm text-muted-foreground">{(text?.uploading || "Uploading {progress}%").replace("{progress}", String(progress))}</p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{text ? adminErrorText(error, text) : error}</p> : null}
      {!hasFirebaseClientConfig() ? <p className="text-xs text-muted-foreground">{text?.configureStorage || "Configure Firebase Storage to enable uploads."}</p> : null}
    </div>
  );
}
