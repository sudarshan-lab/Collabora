import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";

interface TeamMember {
  id: number;
  name: string;
  role: string;
  avatar: string;
}

interface TeamMemberListProps {
  members: TeamMember[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function TeamMemberList({ members }: TeamMemberListProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      {members.map((member) => (
        <motion.div
          key={member.id}
          variants={item}
          className="hover-lift p-4 rounded-lg border border-gray-100 bg-gradient-to-br from-gray-50/50 to-white/30 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback>{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900">{member.name}</p>
                <Badge variant="secondary" className="mt-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                  {member.role}
                </Badge>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}