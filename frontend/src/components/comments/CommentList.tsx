import React from 'react';
import { motion } from 'framer-motion';
import { Comment } from '../../types/task';
import { CommentInput } from './CommentInput';
import { format } from 'date-fns';

interface CommentListProps {
  comments: Comment[];
  onAddComment: (content: string) => void;
}

export function CommentList({ comments, onAddComment }: CommentListProps) {
  return (
    <div className="space-y-6">
      <CommentInput onSubmit={onAddComment} />
      
      <div className="space-y-4">
        {comments.map((comment, index) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex gap-4"
          >
            <img
              src={comment.user.avatar}
              alt={comment.user.name}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-900">
                    {comment.user.name}
                  </span>
                  <span className="text-sm text-gray-500">
                    {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                <p className="text-gray-700">{comment.content}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}