import React from 'react';
import { Search, Users } from 'lucide-react';
import { mockUsers } from '../data/MockData';

interface ChatSidebarProps {
  selectedChat: 'team' | string;
  onChatSelect: (chatId: 'team' | string) => void;
}

export function ChatSidebar({ selectedChat, onChatSelect }: ChatSidebarProps) {
  return (
    <div className="w-80 h-full border-r border-gray-200 bg-white flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <button
          onClick={() => onChatSelect('team')}
          className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 ${
            selectedChat === 'team' ? 'bg-blue-50' : ''
          }`}
        >
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline">
              <p className="text-sm font-medium text-gray-900 truncate">Team Chat</p>
              <span className="text-xs text-gray-500">12:34 PM</span>
            </div>
            <p className="text-sm text-gray-500 truncate">
              Latest team updates and discussions
            </p>
          </div>
        </button>

        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Direct Messages
        </div>

        {mockUsers.map((user) => (
          <button
            key={user.id}
            onClick={() => onChatSelect(user.id)}
            className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 ${
              selectedChat === user.id ? 'bg-blue-50' : ''
            }`}
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <span className="text-xs text-gray-500">10:45 AM</span>
              </div>
              <p className="text-sm text-gray-500 truncate">{user.role}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
