import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { DiscussionCard } from '../components/discussions/DiscussionCard';
import { MessageSquare, X, User, Calendar as CalendarIcon, Group, Users } from 'lucide-react';
import {
  deleteDiscussion,
  fetchTeamDetails,
  getAllDiscussions,
  postDiscussion,
  updateDiscussion,
} from '../components/service/service';
import { Discussion } from '../types/discussion';
import { format } from 'date-fns';

export function DiscussionPage() {
  const token = sessionStorage.getItem('Token');
  const { teamId } = useParams<{ teamId: string }>();

  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [isNewDiscussionOpen, setIsNewDiscussionOpen] = useState(false);
  const [newDiscussionContent, setNewDiscussionContent] = useState('');
  const navigate = useNavigate();
  const [teamData, setTeamData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !teamId) return;

      try {
        setIsLoading(true);
        const discussionsData = await getAllDiscussions(token, parseInt(teamId));
        const teamDetails = await fetchTeamDetails(token, parseInt(teamId));

        setDiscussions(discussionsData);
        setTeamData(teamDetails);
      } catch (error) {
        console.error('Failed to fetch data:', error.message);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token, teamId]);

  const handleAddDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscussionContent.trim() || !token || !teamId) return;

    setIsPosting(true);
    try {
      await postDiscussion(token, parseInt(teamId), newDiscussionContent);
      setNewDiscussionContent('');
      setIsNewDiscussionOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Failed to post discussion:', error.message);
    } finally {
      setIsPosting(false);
    }
  };

  const handleAddComment = async (discussionId: number, content: string) => {
    if (!content.trim() || !token || !teamId) return;

    try {
      const newComment = await postDiscussion(token, parseInt(teamId), content, discussionId);

      setDiscussions((prevDiscussions) =>
        prevDiscussions.map((discussion) =>
          discussion.post_id === discussionId
            ? {
                ...discussion,
                subDiscussions: [
                  ...discussion.subDiscussions,
                  {
                    ...newComment,
                  },
                ],
              }
            : discussion
        )
      );
    } catch (error) {
      console.error('Failed to add comment:', error.message);
    }
  };

  const handleUpdateDiscussion = async (postId: number, updatedContent: string) => {
    try {
      await updateDiscussion(token, teamId, postId, updatedContent);

      setDiscussions((prevDiscussions: Discussion[]) =>
        prevDiscussions.map((discussion) => {
          if (discussion.post_id === postId) {
            return { ...discussion, content: updatedContent, updated_at: new Date().toISOString() };
          }
          const updatedSubDiscussions = discussion.subDiscussions.map((subDiscussion) =>
            subDiscussion.post_id === postId
              ? { ...subDiscussion, content: updatedContent, updated_at: new Date().toISOString() }
              : subDiscussion
          );

          return { ...discussion, subDiscussions: updatedSubDiscussions };
        })
      );
    } catch (error) {
      console.error('Failed to update discussion:', error.message);
    }
  };

  const handleDeleteDiscussion = async (postId: number) => {
    try {
      await deleteDiscussion(token, teamId, postId);

      setDiscussions((prevDiscussions: Discussion[]) =>
        prevDiscussions
          .filter((discussion) => discussion.post_id !== postId)
          .map((discussion) => ({
            ...discussion,
            subDiscussions: discussion.subDiscussions.filter(
              (subDiscussion) => subDiscussion.post_id !== postId
            ),
          }))
      );
    } catch (error) {
      console.error('Failed to delete discussion:', error.message);
    }
  };

  return (
    <Layout>
      <div className="grid grid-cols-5 gap-6 max-w-6xl mx-auto px-4 py-8">
        {/* Discussions */}
        <div className="col-span-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageSquare className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">Discussions</h2>
              </div>
              <button
                onClick={() => setIsNewDiscussionOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                New Discussion
              </button>
            </div>
          </motion.div>

          {discussions.length === 0 && isNewDiscussionOpen === false && (
                            <div className="col-span-full text-center py-12">
                                <Users className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No discussions</h3>
                                <p className="mt-1 text-sm text-gray-500">Get started by creating a new discussion.</p>
                            </div>
                        )}

          <AnimatePresence>
            {isNewDiscussionOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Start a New Discussion</h3>
                  <button
                    onClick={() => setIsNewDiscussionOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleAddDiscussion}>
                  <div className="space-y-4">
                    <div>
                      <textarea
                        id="content"
                        value={newDiscussionContent}
                        onChange={(e) => setNewDiscussionContent(e.target.value)}
                        rows={4}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Describe your topic..."
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!newDiscussionContent.trim() || isPosting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                      >
                        {isPosting ? (
                          <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                        ) : null}
                        {isPosting ? 'Posting...' : 'Post Discussion'}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading ? (
            <div className="text-center text-gray-600">Loading discussions...</div>
          ) : (
            <motion.div layout className="space-y-6">
              {discussions.map((discussion) => (
                <DiscussionCard
                  key={discussion.post_id}
                  discussion={discussion}
                  onAddComment={handleAddComment}
                  onUpdateDiscussion={handleUpdateDiscussion}
                  onDeleteDiscussion={handleDeleteDiscussion}
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* Team Details */}
        {discussions.length>0 && (
        <div className='col-span-1'>
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center">
                <div className="w-6 h-6 text-blue-600 mr-2"></div>
                <h2 className="text-2xl font-bold text-gray-900"></h2>
              </div>
            </div>
          </motion.div>
        <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-lg shadow-sm p-6 space-y-6 mt-10  h-[300px] overflow-y-auto"
        >
          {teamData ? (
            <>
              <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Team name</h3>
              <div className="flex items-center gap-2 relative text-sm text-gray-900 mb-2">
              <Users className="w-4 h-4" />
                  {teamData.team.team_name}
                </div>
                
                <h3 className="text-sm font-medium text-gray-500 mb-2">Team Description</h3>
              <div className="flex items-center gap-2 relative text-sm text-gray-900 mb-2">
              <MessageSquare className="w-4 h-4" />
                  {teamData.team.team_description}
                </div>

                <h3 className="text-sm font-medium text-gray-500 mb-2">Created on</h3>
                <div className="flex items-center gap-2 relative text-sm text-gray-900">
                <CalendarIcon
                    className="w-4 h-4 cursor-pointer"
                />
                <span
                    className="cursor-pointer"
                >
                    {format(new Date(teamData.team.created_at), 'MMM d, yyyy')}
                </span>
              </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Members</h4>
                <div className="flex -space-x-2">
                  {teamData.members.map((member: any) => (
                    <div
                      key={member.user_id}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white border-2 border-white cursor-pointer"
                      style={{
                        background: `linear-gradient(135deg, #${Math.floor(
                          Math.random() * 16777215
                        ).toString(16)} 0%, #${Math.floor(
                          Math.random() * 16777215
                        ).toString(16)} 100%)`,
                      }}
                      title={`${member.first_name} ${member.last_name}`}
                    >
                      {member.first_name[0]}
                      {member.last_name[0]}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-gray-500 text-center">Loading team details...</div>
          )}
        </motion.div>
        </div>
        )}
      </div>
    </Layout>
  );
}
