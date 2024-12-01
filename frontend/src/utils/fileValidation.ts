import { SUPPORTED_FILE_TYPES, MAX_FILE_SIZE } from '../components/files/fileTypes';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateFile(file: File): ValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds 10MB limit (${formatFileSize(file.size)})`,
    };
  }

  // Check file extension
  const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
  if (!SUPPORTED_FILE_TYPES.includes(fileExtension as any)) {
    return {
      isValid: false,
      error: `Unsupported file type. Supported types: ${SUPPORTED_FILE_TYPES.join(', ')}`,
    };
  }

  return { isValid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}