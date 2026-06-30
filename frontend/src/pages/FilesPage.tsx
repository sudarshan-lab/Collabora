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
            first_name: file.first_name,
            last_name: file.last_name,
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
            first_name: uploadedFile.file.first_name,
            last_name: uploadedFile.file.last_name,
            
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
        <h1 className="page-title mb-6">Files</h1>
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full flex-shrink-0 lg:w-80">
            <div className="card sticky top-24 p-5">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-400">Upload files</h2>
              <UploadZone
                onFileSelect={handleUploadFile}
                onError={(error) => showToast(error, 'error')}
              />
            </div>
          </div>

          <div className="flex-1">
            <div className="card p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">All files</h2>
                <span className="chip bg-blue-50 text-blue-600">{files.length} file{files.length !== 1 ? 's' : ''}</span>
              </div>
              {isLoading ? (
                <div className="flex flex-col items-center py-16">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-500"></div>
                  <p className="mt-3 text-sm text-gray-500">Loading files...</p>
                </div>
              ) : files.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">📁</div>
                  <p className="mt-4 text-base font-semibold text-gray-900">No files yet</p>
                  <p className="mt-1 text-sm text-gray-500">Upload files using the panel on the left.</p>
                </div>
              ) : (
                <FileList
                  files={files}
                  onDelete={handleDeleteFile}
                  onDownload={handleDownloadFile}
                />
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
