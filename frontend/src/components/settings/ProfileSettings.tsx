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
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="page-title mb-6">Profile Settings</h1>
        <form onSubmit={handleSubmit} className="card space-y-6 p-6 sm:p-8">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Your details</h2>
            <p className="mt-1 text-sm text-gray-500">Update your photo and personal details here.</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <img
                src={profile.avatar}
                alt=""
                className="h-24 w-24 rounded-2xl object-cover ring-2 ring-white shadow-md"
              />
              <button
                type="button"
                className="absolute -bottom-2 -right-2 rounded-full border border-gray-200 bg-white p-2 shadow-sm transition-colors hover:bg-gray-50"
              >
                <Camera className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700">Photo</label>
              <div className="mt-1 text-sm text-gray-500">JPG, GIF or PNG. 1MB max.</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Bio</label>
              <textarea
                rows={4}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="input-field h-auto py-2.5"
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-gray-100 pt-5">
            <button type="submit" className="btn-brand">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}