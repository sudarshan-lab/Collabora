import { Edit2 } from 'lucide-react';
import { Button } from "../../components/ui/button";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";

interface TeamHeaderProps {
  team: {
    team_name: string;
  };
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
}

export function TeamHeader({ team, isEditing, setIsEditing }: TeamHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14 ring-2 ring-indigo-100">
          <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-400 text-white text-lg">
            {team.team_name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            {team.team_name}
          </h2>
          <p className="text-sm text-gray-500">Team Overview</p>
        </div>
      </div>
      <Button
        variant="ghost"
        onClick={() => setIsEditing(!isEditing)}
        className="flex items-center gap-2 hover:bg-gray-100/50"
      >
        <Edit2 className="h-4 w-4" />
        {isEditing ? 'Cancel' : 'Edit'}
      </Button>
    </div>
  );
}