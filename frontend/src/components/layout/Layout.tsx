import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Header } from './Header';
import { TeamSidebar } from '../teams/TeamSidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { teamId } = useParams();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="h-screen flex">
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 transform transition-transform duration-300 ease-in-out z-30 md:relative md:translate-x-0`}
      >
        <TeamSidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={toggleSidebar} />
        <main className="flex-1 overflow-auto bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
}