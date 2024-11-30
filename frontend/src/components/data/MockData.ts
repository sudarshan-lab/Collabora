import { Team, Task, User } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
    role: 'Product Designer',
  },
  {
    id: '2',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@example.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
    role: 'Developer',
  },
  {
    id: '3',
    name: 'Sudarshan',
    email: 'sarah.wilson@example.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
    role: 'Developer',
  },
];

export const mockTeams: Team[] = [
  {
    id: '1',
    name: 'Design Team',
    description: 'Responsible for product design and user experience',
    createdBy: '1',
    members: ['1', '2'],
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Development Team',
    description: 'Frontend and backend development team',
    createdBy: '2',
    members: ['1', '2'],
    createdAt: new Date('2024-01-20'),
  },
];

export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Design System Updates',
    description: 'Update component library with new design tokens',
    status: 'in-progress',
    assignee: '1',
    dueDate: new Date('2024-03-20'),
    priority: 'high',
    teamId: '1',
    createdBy: '1',
    createdAt: new Date('2024-03-01'),
  },
  {
    id: '2',
    title: 'User Research',
    description: 'Conduct user interviews for new feature',
    status: 'todo',
    assignee: '2',
    dueDate: new Date('2024-03-25'),
    priority: 'medium',
    teamId: '1',
    createdBy: '2',
    createdAt: new Date('2024-03-02'),
  },
];