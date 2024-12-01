import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Layout } from '../components/layout/Layout';
import { UploadZone } from '../components/files/UploadZone';
import { FileList } from '../components/files/FileList';
import { Toast } from '../components/ui/toast';
import { fetchFiles, uploadFile, downloadFile, deleteFile } from '../components/service/service';
import { FileItem } from '../types/index';
import { formatFileSize } from '../utils/fileValidation';
import { useNavigate, useParams } from 'react-router-dom';

export function FilesPage() {
  const token = sessionStorage.getItem('Token');
  const teamId = parseInt(useParams<{ teamId: string }>().teamId);
  const navigate = useNavigate();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false); // Page loader state

  useEffect(() => {
    const fetchAllFiles = async () => {
      if (!token || !teamId) return;

      setIsPageLoading(true); // Start page loading
      try {
        const fetchedFiles = await fetchFiles(token, teamId);
        setFiles(
          fetchedFiles.map((file) => ({
            id: file.file_id,
            name: file.original_filename,
            size: formatFileSize(file.file_size),
            type: file.content_type,
            uploadedAt: new Date(file.upload_timestamp),
          }))
        );
      } catch (error) {
        console.error('Error fetching files:', error.message);
        showToast('Failed to fetch files. Please try again.', 'error');
        navigate('/login');
      } finally {
        setIsLoading(false);
        setIsPageLoading(false); // Stop page loading
      }
    };

    fetchAllFiles();
  }, [token, teamId]);

  const showToast = (message, type) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleUploadFile = async (newFiles) => {
    if (!token || !teamId) return;

    setIsPageLoading(true); // Start page loading
    try {
      for (const file of newFiles) {
        const uploadedFile = await uploadFile(token, teamId, file);

        setFiles((prev) => [
          ...prev,
          {
            id: uploadedFile.file.file_id,
            name: file.name,
            size: formatFileSize(file.size),
            type: file.type,
            uploadedAt: uploadedFile.file.upload_timestamp,
          },
        ]);
      }

      showToast('Files uploaded successfully!', 'success');
    } catch (error) {
      console.error('Failed to upload files:', error.message);
      showToast('Error uploading files. Please try again.', 'error');
    } finally {
      setIsPageLoading(false); // Stop page loading
    }
  };

  const handleDeleteFile = async (id) => {
    setIsPageLoading(true); // Start page loading
    try {
      await deleteFile(token, id, teamId);
      setFiles((prev) => prev.filter((file) => file.id !== id));
      showToast('File deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting file:', error.message);
      showToast('Failed to delete file. Please try again.', 'error');
    } finally {
      setIsPageLoading(false); // Stop page loading
    }
  };

  const handleDownloadFile = async (id) => {
    setIsPageLoading(true); // Start page loading
    try {
      await downloadFile(token, id, teamId);
      showToast('File downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error downloading file:', error.message);
      showToast('Failed to download file. Please try again.', 'error');
    } finally {
      setIsPageLoading(false); // Stop page loading
    }
  };

  return (
    <Layout>
      {/* Page Loader */}
      {isPageLoading && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-white rounded-full animate-spin"></div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-8">
              <h2 className="text-lg font-medium text-gray-900 mb-3">Upload Files</h2>
              <UploadZone
                onFileSelect={handleUploadFile}
                onError={(error) => showToast(error, 'error')}
              />
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">All Files</h2>
                <span className="text-sm text-gray-500">{files.length} files</span>
              </div>
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">Loading files...</p>
                </div>
              ) : (
                <FileList
                  files={files}
                  onDelete={handleDeleteFile}
                  onDownload={handleDownloadFile}
                />
              )}
              {!isLoading && files.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No files available</p>
                  <p className="text-gray-400 text-sm mt-2">Upload files using the panel on the left</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </Layout>
  );
}
