import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, ChevronDown, ChevronUp, Send, Pencil, Trash } from 'lucide-react';
import { Discussion } from '../../types/discussion';

interface DiscussionCardProps {
  discussion: Discussion;
  onAddComment: (discussionId: number, content: string) => void;
  onUpdateDiscussion: (discussionId: number, updatedContent: string) => void;
  onDeleteDiscussion: (discussionId: number) => void;
}

export function DiscussionCard({
  discussion,
  onAddComment,
  onUpdateDiscussion,
  onDeleteDiscussion,
}: DiscussionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(discussion.content);
  const [editingSubDiscussionId, setEditingSubDiscussionId] = useState<number | null>(null);
  const [editedSubContent, setEditedSubContent] = useState<string>('');
  const currentUser = JSON.parse(sessionStorage.getItem('User'));

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(discussion.post_id, newComment);
      setNewComment('');
    }
  };

  const handleUpdateDiscussion = () => {
    if (editedContent.trim()) {
      onUpdateDiscussion(discussion.post_id, editedContent);
      setIsEditing(false);
    }
  };

  const handleUpdateSubDiscussion = (subDiscussionId: number) => {
    if (editedSubContent.trim()) {
      onUpdateDiscussion(subDiscussionId, editedSubContent);
      setEditingSubDiscussionId(null);
      setEditedSubContent('');
    }
  };

  const getAvatarGradient = (name: string) => {
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
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4 hover:shadow-md transition-all"
    >
      {/* Discussion Header */}
      <div className="flex items-start space-x-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{
            background: getAvatarGradient(discussion.first_name),
          }}
        >
          {discussion.first_name[0]}
          {discussion.last_name[0]}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">
                {`${discussion.first_name} ${discussion.last_name}`}
              </span>
              <span className="text-sm text-gray-500">·</span>
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(discussion.posted_at), { addSuffix: true })}
              </span>
            </div>
            {isEditing ? (
              <button
                onClick={() => onDeleteDiscussion(discussion.post_id)}
                className="text-gray-500 hover:text-gray-700 ml-4"
              >
                <Trash className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-500 hover:text-gray-700 mr-4"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </div>
          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
              <div className="mt-2 flex justify-end space-x-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateDiscussion}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-gray-600">{discussion.content}</p>
          )}
        </div>
      </div>

      {/* Expand/Collapse Comments */}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              Hide Comments
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              Show Comments ({discussion.subDiscussions.length})
            </>
          )}
        </button>
        <div className="flex items-center">
          <MessageSquare className="w-5 h-5 text-gray-400" />
          <span className="ml-1 text-sm text-gray-500">{discussion.subDiscussions.length}</span>
        </div>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 space-y-4"
          >
            {discussion.subDiscussions.map((subDiscussion) => (
              <motion.div
                key={subDiscussion.post_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="pl-4 border-l-2 border-gray-200"
              >
                <div className="flex items-start space-x-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{
                      background: getAvatarGradient(subDiscussion.first_name),
                    }}
                  >
                    {subDiscussion.first_name[0]}
                    {subDiscussion.last_name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {`${subDiscussion.first_name} ${subDiscussion.last_name}`}
                        </span>
                        <span className="text-sm text-gray-500">·</span>
                        <span className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(subDiscussion.posted_at), { addSuffix: true })}
                        </span>
                      </div>
                      {editingSubDiscussionId === subDiscussion.post_id ? (
                        <button
                          onClick={() => onDeleteDiscussion(subDiscussion.post_id)}
                          className="text-gray-500 hover:text-gray-700 ml-4"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (editingSubDiscussionId === subDiscussion.post_id) {
                              setEditingSubDiscussionId(null);
                              setEditedSubContent('');
                            } else {
                              setEditingSubDiscussionId(subDiscussion.post_id);
                              setEditedSubContent(subDiscussion.content);
                            }
                          }}
                          className="text-gray-500 hover:text-gray-700 mr-4"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    {editingSubDiscussionId === subDiscussion.post_id ? (
                      <div className="mt-2">
                        <textarea
                          value={editedSubContent}
                          onChange={(e) => setEditedSubContent(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                        <div className="mt-2 flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              setEditingSubDiscussionId(null);
                              setEditedSubContent('');
                            }}
                            className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleUpdateSubDiscussion(subDiscussion.post_id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-gray-600">{subDiscussion.content}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Add Comment Form */}
            <form onSubmit={handleSubmitComment} className="mt-4">
              <div className="flex items-start space-x-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{
                    background: getAvatarGradient(currentUser.firstName),
                  }}
                >
                  {currentUser.firstName[0]}
                  {currentUser.lastName[0]}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={2}
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Comment
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
