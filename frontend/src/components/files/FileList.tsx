import React from 'react';
import { File, Trash2, Download, Clock } from 'lucide-react';
import { FileItem } from '../../types/index';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

interface FileListProps {
  files: FileItem[];
  onDelete: (id: string) => void;
  onDownload: (id: string) => void; // Add onDownload prop
}

const getFileIcon = (type: string) => {
  if (type.includes('image')) return '🖼️';
  if (type.includes('pdf')) return '📄';
  if (type.includes('video')) return '🎥';
  return '📁';
};

export function FileList({ files, onDelete, onDownload }: FileListProps) {
  return (
    <div className="space-y-3">
      <AnimatePresence>
        {files.map((file) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.2 }}
            className="group bg-white rounded-lg shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-all duration-300 hover:translate-x-1"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 rounded-lg transform transition-transform group-hover:rotate-3">
                <span className="text-xl" role="img" aria-label="file type">
                  {getFileIcon(file.type)}
                </span>
              </div>
              <div>
                <h3 className="text-sm mb-1 font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                  {file.name}
                </h3>
                <p className="text-xs mb-1 text-gray-500">{(file.size)} • Uploaded by {file.first_name} {file.last_name}</p>
                <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{format(new Date(file.uploadedAt), 'MMM d, yyyy h:mm a')}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-4 group-hover:translate-x-0">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDownload(file.id)} // Trigger file download
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors duration-200"
                title="Download"
              >
                <Download className="w-4 h-4 text-gray-600" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDelete(file.id)}
                className="p-1.5 hover:bg-red-50 rounded-full transition-colors duration-200"
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
