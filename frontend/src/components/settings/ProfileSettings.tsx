import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { Layout } from '../layout/Layout';

export function ProfileSettings() {
  const [profile, setProfile] = useState({
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    bio: 'Product Designer passionate about creating beautiful and functional interfaces.',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
  };

  return (
    <Layout>
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-900">Profile Settings</h2>
        <p className="text-sm text-gray-500">
          Update your photo and personal details here.
        </p>
      </div>

      <div className="flex items-center space-x-6">
        <div className="relative">
          <img
            src={profile.avatar}
            alt=""
            className="h-24 w-24 rounded-full object-cover"
          />
          <button
            type="button"
            className="absolute bottom-0 right-0 rounded-full bg-white p-2 shadow-sm border border-gray-200 hover:bg-gray-50"
          >
            <Camera className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">
            Photo
          </label>
          <div className="mt-1 text-sm text-gray-500">
            JPG, GIF or PNG. 1MB max.
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Bio
          </label>
          <textarea
            rows={4}
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Save Changes
        </button>
      </div>
    </form>
    </Layout>
  );
}