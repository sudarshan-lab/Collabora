import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";

interface TeamFormProps {
  isEditing: boolean;
  team: {
    team_name: string;
    team_description: string;
  };
  updatedName: string;
  updatedDescription: string;
  setUpdatedName: (value: string) => void;
  setUpdatedDescription: (value: string) => void;
  onSave: () => void;
  saving: boolean;
}

export function TeamForm({
  isEditing,
  team,
  updatedName,
  updatedDescription,
  setUpdatedName,
  setUpdatedDescription,
  onSave,
  saving,
}: TeamFormProps) {
  return (
    <AnimatePresence mode="wait">
      {isEditing ? (
        <motion.div
          key="editing"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-6"
        >
          <div>
            <label className="text-sm font-medium text-gray-700">Team Name</label>
            <Input
              value={updatedName}
              onChange={(e) => setUpdatedName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <Textarea
              value={updatedDescription}
              onChange={(e) => setUpdatedDescription(e.target.value)}
              className="mt-1"
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={onSave} disabled={saving} className='bg-blue-600 text-white rounded-md hover:bg-blue-700'>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="viewing"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-6"
        >
          <div>
            <label className="text-sm font-medium text-gray-700">Team Name</label>
            <p className="mt-2 text-gray-900">{team.team_name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <p className="mt-2 text-gray-600 leading-relaxed">
              {team.team_description}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}