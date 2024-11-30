import React from 'react';
import { Bell, Menu, Search, User } from 'lucide-react';
import { useTeamStore } from '../../store/teamStore';
import { NotificationDropdown } from './NotificationDropdown';
import { ProfileDropdown } from './ProfileDropdown';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { currentTeam } = useTeamStore();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button 
              onClick={onMenuClick}
              className="p-2 rounded-md hover:bg-gray-100 lg:hidden"
            >
              <Menu className="h-6 w-6 text-gray-500" />
            </button>
            <h1 className="ml-4 text-xl font-semibold text-gray-900">
              {currentTeam ? currentTeam.name : 'Collabora'}
            </h1>
          </div>
          
          <div className="flex-1 max-w-xl px-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects, tasks, or files..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <NotificationDropdown />
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </header>
  );
}