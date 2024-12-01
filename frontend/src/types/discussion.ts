export interface User {
    id: string;
    name: string;
    avatar: string;
    role: string;
  }
  
  export interface Comment {
    id: string;
    content: string;
    author: User;
    createdAt: string;
  }
  
  export interface Discussion {
    post_id(post_id: any, newComment: string): unknown;
    subDiscussions: any;
    posted_at: string | number | Date;
    last_name: any;
    first_name: any;
    id: string;
    title: string;
    content: string;
    author: User;
    createdAt: string;
    comments: Comment[];
  }