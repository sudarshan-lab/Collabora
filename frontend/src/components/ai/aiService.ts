import axios from 'axios';
import API_BASE_URL from '../../lib/url';

export type AIResult = {
  title: string;
  issue_type: string;
  priority: string;
  description: string;
  acceptance_criteria: string[];
  subtasks: { title: string; description: string }[];
};

export async function generateWithAI(
  token: string,
  body: { kind: string; prompt: string; teamName?: string }
): Promise<AIResult> {
  const res = await axios.post(`${API_BASE_URL}/ai/generate`, body, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.result;
}
