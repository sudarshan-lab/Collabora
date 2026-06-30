import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Wand2, Bug, BookOpen, ListChecks, CheckCircle2, Plus } from 'lucide-react';
import { generateWithAI, AIResult } from './aiService';
import { createTask } from '../service/service';
import { TypeIcon, PriorityIcon } from '../../lib/issue';

const KINDS = [
  { key: 'story', label: 'User Story', Icon: BookOpen },
  { key: 'bug', label: 'Bug Report', Icon: Bug },
  { key: 'subtasks', label: 'Subtasks', Icon: ListChecks },
  { key: 'acceptance', label: 'Acceptance', Icon: CheckCircle2 },
];

interface Props {
  teamId: string | number;
  teamName?: string;
  onClose: () => void;
  onCreated?: () => void;
}

export function AIAssistant({ teamId, teamName, onClose, onCreated }: Props) {
  const [kind, setKind] = useState('story');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const token = sessionStorage.getItem('Token') || '';

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const r = await generateWithAI(token, { kind, prompt, teamName });
      setResult(r);
    } catch (err: any) {
      setError(
        err?.response?.status === 503
          ? 'AI is not configured on the server yet (missing API key).'
          : err?.response?.data?.message || 'Something went wrong. Try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!result) return;
    setCreating(true);
    try {
      await createTask(token, {
        task_name: result.title,
        task_description:
          result.description +
          (result.acceptance_criteria.length
            ? '\n\n**Acceptance Criteria**\n' + result.acceptance_criteria.map((c) => `- ${c}`).join('\n')
            : ''),
        issue_type: result.issue_type,
        priority: result.priority,
        due_date: null,
        team_id: teamId,
      } as any);
      onCreated?.();
      onClose();
    } catch {
      setError('Failed to create the issue. Try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl border border-white/70 bg-white shadow-2xl"
      >
        {/* header */}
        <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-blue-500 to-pink-500 px-6 py-4 text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <h2 className="text-lg font-bold">AI Assistant</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">
          {/* kind selector */}
          <div className="mb-4 flex flex-wrap gap-2">
            {KINDS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setKind(key)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                  kind === key
                    ? 'border-transparent bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleGenerate}>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Describe your idea</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="input-field h-auto py-2.5"
              placeholder="e.g. Let users reset their password via email"
              autoFocus
            />
            <div className="mt-3 flex justify-end">
              <button type="submit" className="btn-brand" disabled={loading || !prompt.trim()}>
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" /> Generate
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>
          )}

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 rounded-2xl border border-gray-100 bg-gray-50/70 p-5"
              >
                <div className="mb-2 flex items-center gap-2">
                  <TypeIcon type={result.issue_type} />
                  <h3 className="flex-1 text-base font-bold text-gray-900">{result.title}</h3>
                  <PriorityIcon priority={result.priority} />
                </div>
                <p className="whitespace-pre-wrap text-sm text-gray-600">{result.description}</p>

                {result.acceptance_criteria?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">Acceptance criteria</h4>
                    <ul className="space-y-1">
                      {result.acceptance_criteria.map((c, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-700">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.subtasks?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">Suggested subtasks</h4>
                    <ul className="space-y-1.5">
                      {result.subtasks.map((s, i) => (
                        <li key={i} className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-sm">
                          <p className="font-semibold text-gray-800">{s.title}</p>
                          {s.description && <p className="text-xs text-gray-500">{s.description}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-5 flex justify-end gap-2">
                  <button onClick={() => setResult(null)} className="btn-ghost">Discard</button>
                  <button onClick={handleCreate} className="btn-brand" disabled={creating}>
                    {creating ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Creating…
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" /> Create issue
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
