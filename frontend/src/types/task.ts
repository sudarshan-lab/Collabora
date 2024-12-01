export interface User {
    id: number;
    name: string;
    avatar: string;
    email: string;
    role: string;
  }
  
  export interface Task {
    task_id: number;
    task_name: string;
    task_description: string;
    due_date: string;
    status: 'open' | 'in-progress' | 'completed';
    team_id: number;
    created_at: string;
    sub_tasks?: Task[];
    comments?: Comment[];
  }
  
  export interface Comment {
    id: number;
    task_id: number;
    user_id: number;
    content: string;
    created_at: string;
    user: User;
  }