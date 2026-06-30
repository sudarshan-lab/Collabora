
const express = require('express');
const cors = require('cors');
const pool = require('./db'); 
const authRouter = require('./routes/auth');
const teamRouter = require('./routes/team-module');
const taskRouter = require('./routes/task-module');
const discussionRouter = require('./routes/discussion-module');
const fileRouter = require('./routes/file-module');
const notificationRouter = require('./routes/notificationRouter');
const aiRouter = require('./routes/ai-module');
const app = express();
// Cloud Run injects PORT (defaults to 8080); fall back to 3000 locally.
const port = process.env.PORT || 3000;

// Comma-separated list of allowed frontend origins, e.g.
// CORS_ORIGINS="https://collabora.web.app,http://localhost:5173"
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));


app.use(express.json()); 
app.use('/auth', authRouter); 
app.use('/team', teamRouter);
app.use('/tasks', taskRouter);
app.use('/discussion', discussionRouter);
app.use('/files', fileRouter);
app.use('/notifications', notificationRouter);
app.use('/ai', aiRouter);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

