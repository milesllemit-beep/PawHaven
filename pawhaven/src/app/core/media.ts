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
