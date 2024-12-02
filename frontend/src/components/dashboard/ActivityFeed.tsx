// import React from 'react';
// import { MessageSquare, Upload, CheckSquare } from 'lucide-react';

// type Activity = {
//   id: string;
//   type: 'comment' | 'upload' | 'task';
//   user: string;
//   action: string;
//   time: string;
// };

// const activities: Activity[] = [
//   {
//     id: '1',
//     type: 'comment',
//     user: 'Emma Davis',
//     action: 'commented on Project Requirements',
//     time: '5 minutes ago'
//   },
//   {
//     id: '2',
//     type: 'upload',
//     user: 'Alex Thompson',
//     action: 'uploaded Design_Assets.zip',
//     time: '1 hour ago'
//   },
//   {
//     id: '3',
//     type: 'task',
//     user: 'Sarah Wilson',
//     action: 'completed Sprint Planning task',
//     time: '2 hours ago'
//   }
// ];

// const getActivityIcon = (type: Activity['type']) => {
//   switch (type) {
//     case 'comment':
//       return <MessageSquare className="h-5 w-5 text-blue-500" />;
//     case 'upload':
//       return <Upload className="h-5 w-5 text-green-500" />;
//     case 'task':
//       return <CheckSquare className="h-5 w-5 text-purple-500" />;
//   }
// };

// export function ActivityFeed() {
//   return (
//     <div className="bg-white rounded-lg shadow">
//       <div className="px-6 py-4 border-b border-gray-200">
//         <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
//       </div>
//       <div className="divide-y divide-gray-200">
//         {activities.map((activity) => (
//           <div key={activity.id} className="px-6 py-4 hover:bg-gray-50">
//             <div className="flex items-center space-x-3">
//               {getActivityIcon(activity.type)}
//               <div>
//                 <p className="text-sm text-gray-900">
//                   <span className="font-medium">{activity.user}</span>{' '}
//                   {activity.action}
//                 </p>
//                 <p className="text-xs text-gray-500">{activity.time}</p>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useState } from 'react';
import { MessageSquare, Calendar, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fetchTeamDetails } from '../service/service';
import { useNavigate, useParams } from 'react-router-dom';

export function ActivityFeed() {
  const [isLoading, setIsLoading] = useState(false);
  const [teamData, setTeamData] = useState(null);
  const navigate = useNavigate();
  const { teamId } = useParams<{ teamId: string }>();
  const token = sessionStorage.getItem('Token');
  

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !teamId) return;

      try {
        setIsLoading(true);
        const teamDetails = await fetchTeamDetails(token, parseInt(teamId));
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

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Team Details</h2>
      </div>
      {isLoading ? (
        <div className="px-6 py-4 text-center text-gray-500">
          <svg
            className="animate-spin h-5 w-5 text-gray-500 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
          <p className="mt-2">Loading team details...</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className=""
        >
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow-sm p-6 space-y-6  h-[300px] overflow-y-auto"
          >
            {teamData ? (
              <>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Team Name
                  </h3>
                  <div className="flex items-center gap-2 relative text-sm text-gray-900 mb-2">
                    <Users className="w-4 h-4" />
                    {teamData.team.team_name}
                  </div>

                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Team Description
                  </h3>
                  <div className="flex items-center gap-2 relative text-sm text-gray-900 mb-2">
                    <MessageSquare className="w-4 h-4" />
                    {teamData.team.team_description}
                  </div>

                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Created On
                  </h3>
                  <div className="flex items-center gap-2 relative text-sm text-gray-900">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(teamData.team.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Members</h4>
                  <div className="flex -space-x-2">
                    {teamData.members.map((member) => (
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
              <div className="text-gray-500 text-center">No team details found</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
