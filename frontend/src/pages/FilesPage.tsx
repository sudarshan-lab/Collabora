import React from 'react';
import { Layout } from '../components/layout/Layout';
import { Upload, File } from 'lucide-react';

export function FilesPage() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Files</h1>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Upload className="w-5 h-5" />
            Upload File
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            {/* File upload zone */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <File className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  Drag and drop your files here, or click to select files
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}