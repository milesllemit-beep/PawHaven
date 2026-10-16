import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';

export function mediaUrl(url: string | null | undefined): string {
  if (!url) {
    return '';
  }
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return `${environment.storageUrl}${url}`;
}

export function toFormData(
  data: Record<string, unknown>,
  filesField: string,
  files: File[],
): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined || value === '') {
      continue;
    }
    formData.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
  }

  for (const file of files) {
    formData.append(filesField, file);
  }

  return formData;
}

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Validate a set of selected image files before upload.
 *
 * Mirrors the backend rules (jpeg/png/webp, 5 MB each, up to maxCount files)
 * so users get immediate, clear feedback.
 */
export function validateImageFiles(files: File[], maxCount = 10): string | null {
  if (files.length === 0) {
    return null;
  }
  if (files.length > maxCount) {
    return `Please choose at most ${maxCount} photos.`;
  }
  for (const file of files) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return `"${file.name}" is not a supported image. Use JPEG, PNG, or WebP.`;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return `"${file.name}" is larger than ${formatBytes(MAX_IMAGE_BYTES)}.`;
    }
  }
  return null;
}

export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const errors = error.error?.errors as Record<string, string[]> | undefined;
    if (errors) {
      return Object.values(errors).flat().join(' ');
    }
    if (error.error?.message) {
      return error.error.message as string;
    }
    if (error.status === 0) {
      return 'Cannot reach the server. Is the API running?';
    }
  }
  return 'Something went wrong. Please try again.';
}
