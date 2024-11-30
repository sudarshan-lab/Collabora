export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'new' | 'assigned' | 'in_progress' | 'on_hold' | 'completed';
  assignee?: string;
  dueDate: string;
  createdAt: string;
  teamId: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  members: string[];
}

export interface File {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  teamId: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  type: 'task' | 'file' | 'comment';
  action: string;
  userId: string;
  teamId: string;
  timestamp: string;
  metadata: Record<string, any>;
}