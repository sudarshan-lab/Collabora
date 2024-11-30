import React from 'react';
import { File, Download, MoreVertical } from 'lucide-react';

type FileItem = {
  id: string;
  name: string;
  type: string;
  size: string;
  updatedAt: string;
  uploadedBy: string;
};

const files: FileItem[] = [
  {
    id: '1',
    name: 'Project_Requirements.pdf',
    type: 'PDF',
    size: '2.4 MB',
    updatedAt: '2024-03-18',
    uploadedBy: 'Alex Thompson'
  },
  {
    id: '2',
    name: 'Design_Assets.zip',
    type: 'ZIP',
    size: '15.7 MB',
    updatedAt: '2024-03-17',
    uploadedBy: 'Emma Davis'
  },
  {
    id: '3',
    name: 'Meeting_Notes.docx',
    type: 'DOCX',
    size: '542 KB',
    updatedAt: '2024-03-16',
    uploadedBy: 'Chris Wilson'
  }
];

export function FilesList() {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Recent Files</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {files.map((file) => (
          <div key={file.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <File className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {file.size} • Uploaded by {file.uploadedBy}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 rounded-md hover:bg-gray-100">
                  <Download className="h-4 w-4 text-gray-500" />
                </button>
                <button className="p-2 rounded-md hover:bg-gray-100">
                  <MoreVertical className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}