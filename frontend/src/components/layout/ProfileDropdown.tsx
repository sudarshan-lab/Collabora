import React, { useState } from 'react';
import { User, LogOut } from 'lucide-react';

export function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  // Get the current user from session storage
  const currentUser = JSON.parse(sessionStorage.getItem("User"));

  // Generate a gradient background for the avatar based on the user's initials
  const getAvatarGradient = (name) => {
    const colors = [
      ['#4a90e2', '#5bc0eb'],
      ['#3d5afe', '#536dfe'],
      ['#1e88e5', '#42a5f5'],
      ['#1976d2', '#63a4ff'], 
      ['#1565c0', '#5e92f3'],
      ['#2a6fdb', '#5ca9f2'],
      ['#0277bd', '#81d4fa'],      
      ['#115293', '#57b8ff'],
    ];
    const index = name.charCodeAt(0) % colors.length;
    return `linear-gradient(135deg, ${colors[index][0]}, ${colors[index][1]})`;
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
          {/* User Info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center">
              {/* Avatar */}
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                style={{
                  background: getAvatarGradient(currentUser.firstName + currentUser.lastName),
                }}
              >
                {currentUser.firstName[0]}
                {currentUser.lastName[0]}
              </div>
              {/* User Details */}
              <div className="ml-3">
                <p className="text-sm font-semibold text-gray-900">
                  {`${currentUser.firstName.trim()} ${currentUser.lastName.trim()}`}
                </p>
                <p className="text-sm text-gray-500">{currentUser.email}</p>
              </div>
            </div>
          </div>

          {/* Dropdown Options */}
          <div className="py-2">
            <button
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              onClick={() => {
                sessionStorage.clear();
                window.location.href = "/login";
              }}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
