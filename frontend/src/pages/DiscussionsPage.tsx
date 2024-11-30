import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { ChatSidebar } from '../components/discussions/ChatSidebar';
import { ChatArea } from '../components/discussions/ChatArea';
import { useTeamStore } from '../store/teamStore';

export function DiscussionsPage() {
  const { currentTeam } = useTeamStore();
  const [selectedChat, setSelectedChat] = useState<'team' | string>('team');

  return (
    <Layout>
      {/* This div must take the full height of the screen */}
      <div className="h-full flex">
        <ChatSidebar 
          selectedChat={selectedChat}
          onChatSelect={setSelectedChat}
        />
        <ChatArea 
          chatId={selectedChat}
          teamName={currentTeam?.name || 'Team Chat'}
        />
      </div>
    </Layout>
  );
}
