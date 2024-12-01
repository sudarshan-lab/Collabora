import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { validateFile, ValidationResult } from '../utils/fileValidation';
import { SUPPORTED_FILE_TYPES } from '../constants/fileTypes';

interface UseFileUploadProps {
  onFileSelect: (files: File[]) => void;
  onError: (error: string) => void;
}

export function useFileUpload({ onFileSelect, onError }: UseFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const validateFiles = (files: File[]): { validFiles: File[], errors: string[] } => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const validation = validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else if (validation.error) {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    return { validFiles, errors };
  };

  const handleFiles = (files: File[]) => {
    const { validFiles, errors } = validateFiles(files);
    
    if (errors.length > 0) {
      errors.forEach(error => onError(error));
    }

    if (validFiles.length > 0) {
      onFileSelect(validFiles);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  return {
    isDragging,
    fileInputRef,
    handleDrag,
    handleDrop,
    handleFileChange,
  };
}