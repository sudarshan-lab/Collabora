import React from 'react';
import { Upload } from 'lucide-react';
import { useFileUpload } from '../../hooks/useFileUpload';
import { SUPPORTED_FILE_TYPES } from './fileTypes';
import { motion } from 'framer-motion';

interface UploadZoneProps {
  onFileSelect: (files: File[]) => void;
  onError: (error: string) => void;
}

export function UploadZone({ onFileSelect, onError }: UploadZoneProps) {
    const { isDragging, fileInputRef, handleDrag, handleDrop, handleFileChange } = useFileUpload({
      onFileSelect,
      onError,
    });
  
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`relative border-2 border-dashed rounded-lg transition-all duration-300 ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 bg-white'
        }`}
        onDragOver={handleDrag}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
          accept={SUPPORTED_FILE_TYPES.join(',')}
        />
        
        <div className="p-4 text-center">
          <motion.div
            animate={isDragging ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-3"
          >
            <Upload 
              className={`w-8 h-8 mx-auto ${
                isDragging ? 'text-blue-500' : 'text-gray-400'
              }`}
            />
          </motion.div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Drop files here or{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 transition-colors duration-200"
              >
                browse
              </button>
            </p>
            <div className="text-xs text-gray-500">
              <p>Supported types:</p>
              <div className="flex flex-wrap gap-1 justify-center mt-1">
                {SUPPORTED_FILE_TYPES.map((type) => (
                  <span
                    key={type}
                    className="px-2 py-1 bg-gray-100 rounded-full"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }