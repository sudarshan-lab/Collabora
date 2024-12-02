import React from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { TaskList } from '../components/dashboard/TaskList';
import { FilesList } from '../components/dashboard/FilesList';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';

export function TeamDashboard() {
  const { teamId } = useParams();

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <TaskList />
            <FilesList />
          </div>
          <div>
            <ActivityFeed />
          </div>
        </div>
      </div>
    </Layout>
  );
}