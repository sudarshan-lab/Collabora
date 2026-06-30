const express = require('express');
const jwt = require('jsonwebtoken');
const { generate, aiEnabled } = require('../services/ai');

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;

function getUserIdFromToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET).userId;
  } catch {
    return null;
  }
}

// POST /ai/generate  { kind, prompt, teamName }
app.post('/generate', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const userId = getUserIdFromToken(token);
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
  }

  if (!aiEnabled) {
    return res.status(503).json({ message: 'AI assistant is not configured on the server.' });
  }

  const { kind, prompt, teamName } = req.body || {};
  if (!prompt || !String(prompt).trim()) {
    return res.status(400).json({ message: 'A prompt is required.' });
  }

  try {
    const result = await generate({ kind, prompt: String(prompt).slice(0, 2000), teamName });
    res.json({ result });
  } catch (error) {
    console.error('AI generate error:', error.message);
    res.status(500).json({ message: 'Failed to generate. Please try again.', error: error.message });
  }
});

// GET /ai/status — lets the UI hide the feature when unconfigured
app.get('/status', (_req, res) => res.json({ enabled: aiEnabled }));

module.exports = app;
