import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { File, Users } from 'lucide-react';
import { fetchFiles } from '../service/service';
import { format } from 'date-fns';
import { formatFileSize } from '../../utils/fileValidation';

type FileItem = {
  id: string;
  original_filename: string;
  type: string;
  file_size: string;
  uploaded_timestamp: string;
  first_name: string;
  last_name: string;
};

export function FilesList() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const { teamId } = useParams<{ teamId: string }>();
  const token = sessionStorage.getItem('Token');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLatestFiles = async () => {
      if (!token || !teamId) return;

      try {
        setLoadingFiles(true);
        const fetchedFiles = await fetchFiles(token, teamId);
        const latestFiles = fetchedFiles
          .sort(
            (a: FileItem, b: FileItem) =>
              new Date(b.uploaded_timestamp).getTime() - new Date(a.uploaded_timestamp).getTime()
          )
          .slice(0, 3);

        setFiles(latestFiles);
      } catch (error) {
        console.error('Error fetching files:', error.message);
      } finally {
        setLoadingFiles(false);
      }
    };

    fetchLatestFiles();
  }, [token, teamId]);

  const handleFileClick = () => {
    sessionStorage.setItem("ActiveNav", 'files');
    navigate(`/team/${teamId}/files`);
  };

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-lg font-bold text-gray-900">Recent Files</h2>
      </div>
      {loadingFiles ? (
        <div className="px-6 py-4 text-center text-gray-500">
          <svg
            className="animate-spin h-5 w-5 text-gray-500 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
          <p className="mt-2">Loading files...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="mx-auto h-10 w-10 text-gray-300" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No files</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by uploading new files.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {files.map((file) => (
            <div
              key={file.id}
              className="cursor-pointer px-6 py-4 transition-colors hover:bg-blue-50/40"
              onClick={handleFileClick}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                    <File className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.original_filename}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.file_size)} • Uploaded by {file.first_name} {file.last_name}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
