import React, { useState } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { mockUsers } from '../data/MockData';

interface ChatAreaProps {
  chatId: 'team' | string;
  teamName: string;
}

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
}

// Mock messages
const mockMessages: Message[] = [
  {
    id: '1',
    content: 'Hey team! Hows the new feature coming along?',
    sender: '1',
    timestamp: new Date('2024-03-10T10:00:00'),
  },
  {
    id: '2',
    content: 'Making good progress! The UI is almost complete.',
    sender: '2',
    timestamp: new Date('2024-03-10T10:05:00'),
  },
];

export function ChatArea({ chatId, teamName }: ChatAreaProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(mockMessages);

  const handleSend = () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: '1', // Current user ID
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {chatId === 'team' 
            ? teamName 
            : mockUsers.find(u => u.id === chatId)?.name || 'Chat'}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const sender = mockUsers.find(u => u.id === msg.sender);
          const isCurrentUser = msg.sender === '1';

          return (
            <div
              key={msg.id}
              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[70%] ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                <img
                  src={sender?.avatar}
                  alt={sender?.name}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <div className={`flex items-baseline gap-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm font-medium text-gray-900">
                      {sender?.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div
                    className={`mt-1 rounded-lg p-3 ${
                      isCurrentUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-200 p-4">
        <div className="flex items-end gap-4">
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full resize-none rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-500 pl-4 pr-12 py-3"
              rows={1}
            />
          </div>
          <button
            onClick={handleSend}
            className="bg-blue-600 text-white p-3 mb-2.5 rounded-lg hover:bg-blue-700"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
