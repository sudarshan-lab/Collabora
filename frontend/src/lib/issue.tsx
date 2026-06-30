import {
  Bookmark, Bug, CheckSquare, Zap,
  ChevronsUp, ChevronUp, Equal, ChevronDown, ChevronsDown,
} from 'lucide-react';

// JIRA-style issue types. `issue_type` will become a real DB column after the
// schema migration; until then callers may derive it deterministically.
export const ISSUE_TYPES: Record<string, { label: string; Icon: any; color: string; bg: string }> = {
  story: { label: 'Story', Icon: Bookmark, color: 'text-green-600', bg: 'bg-green-100' },
  task: { label: 'Task', Icon: CheckSquare, color: 'text-blue-600', bg: 'bg-blue-100' },
  bug: { label: 'Bug', Icon: Bug, color: 'text-red-600', bg: 'bg-red-100' },
  epic: { label: 'Epic', Icon: Zap, color: 'text-purple-600', bg: 'bg-purple-100' },
};

export const PRIORITIES: Record<string, { label: string; Icon: any; color: string }> = {
  highest: { label: 'Highest', Icon: ChevronsUp, color: 'text-red-500' },
  high: { label: 'High', Icon: ChevronUp, color: 'text-orange-500' },
  medium: { label: 'Medium', Icon: Equal, color: 'text-amber-500' },
  low: { label: 'Low', Icon: ChevronDown, color: 'text-sky-500' },
  lowest: { label: 'Lowest', Icon: ChevronsDown, color: 'text-gray-400' },
};

// Board columns. Maps the various status strings the API uses into 4 columns.
export const COLUMNS: { key: string; title: string; accent: string; dot: string; value: string; statuses: string[] }[] = [
  { key: 'todo', title: 'To Do', accent: 'text-gray-600', dot: 'bg-gray-400', value: 'open', statuses: ['open', 'unassigned', 'to-do', 'todo', 'backlog', ''] },
  { key: 'inprogress', title: 'In Progress', accent: 'text-blue-600', dot: 'bg-blue-500', value: 'in-progress', statuses: ['in-progress', 'inprogress', 'in progress'] },
  { key: 'review', title: 'In Review', accent: 'text-purple-600', dot: 'bg-purple-500', value: 'in-review', statuses: ['in-review', 'review', 'in review'] },
  { key: 'done', title: 'Done', accent: 'text-green-600', dot: 'bg-green-500', value: 'completed', statuses: ['completed', 'done', 'closed'] },
];

export function columnForStatus(status?: string) {
  const s = (status || '').toLowerCase();
  return COLUMNS.find((c) => c.statuses.includes(s)) || COLUMNS[0];
}

// Deterministic placeholders until issue_type / priority exist in the DB.
const TYPE_KEYS = ['story', 'task', 'bug', 'epic'];
const PRIO_KEYS = ['high', 'medium', 'low', 'highest'];
export const deriveType = (t: any): string => t?.issue_type || TYPE_KEYS[(Number(t?.task_id) || 0) % TYPE_KEYS.length];
export const derivePriority = (t: any): string => t?.priority || PRIO_KEYS[(Number(t?.task_id) || 0) % PRIO_KEYS.length];

// Project key like "MOB-101" from the team name + task id.
export function issueKey(teamName: string | undefined, taskId: number | string) {
  const prefix = (teamName || 'TASK').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'TSK';
  return `${prefix}-${taskId}`;
}

export const initials = (first?: string, last?: string) =>
  `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase();

export function Avatar({ first, last, size = 'h-6 w-6 text-[10px]' }: { first?: string; last?: string; size?: string }) {
  return (
    <span className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-pink-500 font-bold text-white`}>
      {initials(first, last) || '?'}
    </span>
  );
}

export function TypeIcon({ type }: { type: string }) {
  const t = ISSUE_TYPES[type] || ISSUE_TYPES.task;
  return (
    <span className={`flex h-5 w-5 items-center justify-center rounded ${t.bg}`} title={t.label}>
      <t.Icon className={`h-3.5 w-3.5 ${t.color}`} />
    </span>
  );
}

export function PriorityIcon({ priority }: { priority: string }) {
  const p = PRIORITIES[priority] || PRIORITIES.medium;
  return <p.Icon className={`h-4 w-4 ${p.color}`} aria-label={p.label} />;
}
