import React from 'react';
import { motion } from 'framer-motion';
import { Comment } from '../../types/task';
import { CommentInput } from './CommentInput';
import { format } from 'date-fns';
import { Trash } from 'lucide-react';

interface CommentListProps {
  comments: Comment[];
  onAddComment: (content: string) => void;
  onDeleteComment: (commentId: number) => Promise<void>;
}

export function CommentList({ comments, onAddComment, onDeleteComment }: CommentListProps) {
  const getGradientBackground = (name: string) => {
    const colors = [
      ['#4a90e2', '#5bc0eb'],
      ['#3d5afe', '#536dfe'],
      ['#1e88e5', '#42a5f5'],
      ['#1976d2', '#63a4ff'],
      ['#1565c0', '#5e92f3'],
      ['#2a6fdb', '#5ca9f2'],
      ['#0277bd', '#81d4fa'],
      ['#115293', '#57b8ff'],
    ];
    const index = name.charCodeAt(0) % colors.length;
    return `linear-gradient(135deg, ${colors[index][0]}, ${colors[index][1]})`;
  };

  return (
    <div className="space-y-6">
      <CommentInput onSubmit={onAddComment} />
      <div className="space-y-4">
        {comments.map((comment, index) => (
          <motion.div
            key={comment.comment_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex gap-4"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{
                background: getGradientBackground(comment.first_name),
              }}
            >
              {comment.first_name[0]}
              {comment.last_name[0]}
            </div>
            <div className="flex-1">
              <div className="bg-gray-50 rounded-lg p-4 relative">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-900">
                    {`${comment.first_name} ${comment.last_name}`}
                  </span>
                  <span className="text-sm text-gray-500">
                    {format(new Date(comment.commented_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                <p className="text-gray-700">{comment.content}</p>
                <button
                  onClick={() => onDeleteComment(comment.comment_id)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-red-600"
                  aria-label="Delete Comment"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
