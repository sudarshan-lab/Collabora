import React, { useState } from 'react';
import { User, Settings, LogOut, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const profile = {
  name: "Alex Johnson",
  email: "alex.johnson@example.com",
  role: "Product Designer",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
};

export function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSettingsClick = () => {
    setIsOpen(false);
    navigate('/settings/profile');
  };

  return (
    <div className="relative">
      <button 
        className="p-2 rounded-md hover:bg-gray-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        <User className="h-6 w-6 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center">
              <img
                src={profile.avatar}
                alt={profile.name}
                className="h-10 w-10 rounded-full"
              />
              <div className="ml-3">
                <p className="text-sm font-semibold text-gray-900">{profile.name}</p>
                <p className="text-sm text-gray-500">{profile.email}</p>
              </div>
            </div>
          </div>

          <div className="py-2">
            <button 
              onClick={handleSettingsClick}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <Settings className="h-4 w-4 mr-3" />
              Settings
            </button>
            <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center">
              <HelpCircle className="h-4 w-4 mr-3" />
              Help & Support
            </button>
            <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center">
              <LogOut className="h-4 w-4 mr-3" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}