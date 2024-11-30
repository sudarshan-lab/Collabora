import React from 'react';
import { MessageSquare, Upload, CheckSquare } from 'lucide-react';

type Activity = {
  id: string;
  type: 'comment' | 'upload' | 'task';
  user: string;
  action: string;
  time: string;
};

const activities: Activity[] = [
  {
    id: '1',
    type: 'comment',
    user: 'Emma Davis',
    action: 'commented on Project Requirements',
    time: '5 minutes ago'
  },
  {
    id: '2',
    type: 'upload',
    user: 'Alex Thompson',
    action: 'uploaded Design_Assets.zip',
    time: '1 hour ago'
  },
  {
    id: '3',
    type: 'task',
    user: 'Sarah Wilson',
    action: 'completed Sprint Planning task',
    time: '2 hours ago'
  }
];

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'comment':
      return <MessageSquare className="h-5 w-5 text-blue-500" />;
    case 'upload':
      return <Upload className="h-5 w-5 text-green-500" />;
    case 'task':
      return <CheckSquare className="h-5 w-5 text-purple-500" />;
  }
};

export function ActivityFeed() {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {activities.map((activity) => (
          <div key={activity.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center space-x-3">
              {getActivityIcon(activity.type)}
              <div>
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{activity.user}</span>{' '}
                  {activity.action}
                </p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}