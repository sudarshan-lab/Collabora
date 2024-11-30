import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Reply, Send } from 'lucide-react';
import { Comment } from '../../types/task';
import { format } from 'date-fns';

interface CommentThreadProps {
  comment: Comment;
  onReply: (commentId: number, content: string) => void;
}

export function CommentThread({ comment, onReply }: CommentThreadProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyContent.trim()) {
      onReply(comment.id, replyContent);
      setReplyContent('');
      setIsReplying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex gap-4">
        <img
          src={comment.user.avatar}
          alt={comment.user.name}
          className="w-10 h-10 rounded-full"
        />
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-gray-900">
                {comment.user.name}
              </span>
              <span className="text-sm text-gray-500">
                {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="mt-2 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <Reply className="w-4 h-4" />
              Reply
            </button>
          </div>

          {isReplying && (
            <motion.form
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmitReply}
              className="mt-2 flex gap-2"
            >
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </motion.form>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-14 space-y-4 border-l-2 border-gray-100 pl-4">
          {comment.replies.map((reply) => (
            <CommentThread key={reply.id} comment={reply} onReply={onReply} />
          ))}
        </div>
      )}
    </motion.div>
  );
}