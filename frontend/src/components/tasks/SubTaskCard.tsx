
import { useNavigate, useParams } from 'react-router-dom';
import { CalendarIcon, Clock, User } from 'lucide-react';
import { Task } from '../../types/task';
import { format } from 'date-fns';

interface SubTaskCardProps {
  subTask: Task; 
}

export function SubTaskCard({ subTask }: SubTaskCardProps) {
  const navigate = useNavigate();
  const { teamId } = useParams<{ teamId: string }>();

  return (
    <div
      className="border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => navigate(`/team/${teamId}/tasks/${subTask?.task_id}`)} 
    >
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center">
          <h4 className="text-sm font-semibold text-gray-900 mr-4">{subTask?.task_name || 'Unnamed Task'}</h4>

          <span
            className={`px-3 py-1 rounded-full text-xs font-medium mr-4 ${
              subTask?.status === 'open'
                ? 'bg-blue-100 text-blue-600'
                : subTask?.status === 'in-progress'
                ? 'bg-yellow-100 text-yellow-600'
                : 'bg-green-100 text-green-600'
            }`}
          >
            {subTask?.status || 'Unknown'}
          </span>

          <div className="flex items-center gap-2 relative text-sm text-gray-900">
          <CalendarIcon
            className="w-4 h-4 cursor-pointer"
          />
          <span
            className="cursor-pointer"
          >
            {format(new Date(subTask.due_date), 'MMM d, yyyy')}
          </span>
        </div>
        </div>
      </div>

      <div className="px-4 py-2">
        <p className="text-sm text-gray-500">{subTask?.task_description || 'No Description Available'}</p>
      </div>

      <div className="flex items-center gap-2 px-4 py-2">
        {subTask?.user_id ? (
          <>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
              style={{
                background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
              }}
            >
              {subTask?.first_name?.[0] || ''}{subTask?.last_name?.[0] || ''}
            </div>
            <span className="text-sm text-gray-900">
              {subTask?.first_name || ''} {subTask?.last_name || ''}
            </span>
          </>
        ) : (
          <>
          <User className="w-4 h-4" />
          <span className="text-sm text-gray-500">Unassigned</span>
          </>
        )}
      </div>
    </div>
  );
}
