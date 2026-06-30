// AI assistant service — turns short ideas into structured JIRA-style work items.
// Uses the official Anthropic SDK with Claude. Reads ANTHROPIC_API_KEY from env;
// if it's missing, the feature is disabled (the route returns a clear 503).

const Anthropic = require('@anthropic-ai/sdk');

const apiKey = process.env.ANTHROPIC_API_KEY;
const client = apiKey ? new Anthropic({ apiKey }) : null;
const aiEnabled = Boolean(client);

if (!aiEnabled) {
  console.warn('[ai] ANTHROPIC_API_KEY not set — AI assistant is disabled.');
}

const SYSTEM = `You are a senior product manager and agile coach embedded in "Collabora", a JIRA-style team workspace.
You turn short, rough ideas into clear, well-structured work items that a development team can act on immediately.

Rules:
- Respond with ONLY a single JSON object. No prose, no markdown fences, no commentary.
- The JSON must match this exact shape:
  {
    "title": string,                       // concise issue summary, imperative voice
    "issue_type": "story" | "task" | "bug" | "epic",
    "priority": "highest" | "high" | "medium" | "low" | "lowest",
    "description": string,                 // markdown; for a story use "As a <user>, I want <goal> so that <benefit>"; for a bug include Steps to Reproduce / Expected / Actual
    "acceptance_criteria": string[],       // testable, each a complete sentence; [] if not applicable
    "subtasks": [ { "title": string, "description": string } ]  // 0-6 concrete subtasks; [] if not applicable
  }
- Be specific and realistic. Infer sensible details from the idea; do not ask questions.`;

const KIND_INSTRUCTIONS = {
  story:
    'Write a complete user story. Fill title, issue_type="story", priority, a description in "As a… I want… so that…" form, 3-6 acceptance_criteria, and 2-5 subtasks.',
  bug:
    'Write a bug report. issue_type="bug". The description must include markdown sections "**Steps to reproduce**", "**Expected**", and "**Actual**". Provide acceptance_criteria describing the fixed behavior. subtasks optional.',
  subtasks:
    'Break the idea into subtasks. Keep title/issue_type/priority reasonable for the parent, a short description, empty acceptance_criteria, and 3-6 concrete subtasks.',
  acceptance:
    'Produce acceptance criteria for the idea. Fill title/issue_type/priority/description briefly, and 4-8 thorough, testable acceptance_criteria. subtasks empty.',
  improve:
    'Rewrite and sharpen the idea into a polished work item: a clear title, a crisp description, and acceptance_criteria. Keep issue_type/priority sensible.',
};

function extractJson(text) {
  // The model is instructed to return bare JSON, but be defensive.
  let t = (text || '').trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start !== -1 && end !== -1) t = t.slice(start, end + 1);
  return JSON.parse(t);
}

const ALLOWED_TYPES = ['story', 'task', 'bug', 'epic'];
const ALLOWED_PRIORITIES = ['highest', 'high', 'medium', 'low', 'lowest'];

function normalize(obj) {
  return {
    title: String(obj.title || '').slice(0, 255),
    issue_type: ALLOWED_TYPES.includes(obj.issue_type) ? obj.issue_type : 'task',
    priority: ALLOWED_PRIORITIES.includes(obj.priority) ? obj.priority : 'medium',
    description: String(obj.description || ''),
    acceptance_criteria: Array.isArray(obj.acceptance_criteria)
      ? obj.acceptance_criteria.map(String).filter(Boolean).slice(0, 12)
      : [],
    subtasks: Array.isArray(obj.subtasks)
      ? obj.subtasks
          .filter((s) => s && s.title)
          .map((s) => ({ title: String(s.title).slice(0, 255), description: String(s.description || '') }))
          .slice(0, 8)
      : [],
  };
}

/**
 * Generate a structured work item from a short idea.
 * @param {object} o
 * @param {string} o.kind  one of: story | bug | subtasks | acceptance | improve
 * @param {string} o.prompt the user's one-line idea
 * @param {string} [o.teamName] optional context
 */
async function generate({ kind, prompt, teamName }) {
  if (!aiEnabled) {
    const err = new Error('AI assistant is not configured on the server.');
    err.code = 'AI_DISABLED';
    throw err;
  }
  const instruction = KIND_INSTRUCTIONS[kind] || KIND_INSTRUCTIONS.story;
  const context = teamName ? `\nTeam/project context: ${teamName}.` : '';
  const userContent = `${instruction}${context}\n\nIdea:\n"""${prompt}"""`;

  const message = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 2000,
    system: SYSTEM,
    messages: [{ role: 'user', content: userContent }],
  });

  const text = message.content.find((b) => b.type === 'text')?.text || '';
  return normalize(extractJson(text));
}

module.exports = { generate, aiEnabled };
