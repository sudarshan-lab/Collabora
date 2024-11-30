
const express = require('express');
const cors = require('cors');
const pool = require('./db'); 
const authRouter = require('./routes/auth');
const teamRouter = require('./routes/team-module');
const taskRouter = require('./routes/task-module');
const discussionRouter = require('./routes/discussion-module');
const app = express();
const port = 3000;

app.use(cors({
  origin: 'http://localhost:5173', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  credentials: true 
}));


app.use(express.json()); 
app.use('/auth', authRouter); 
app.use('/team', teamRouter);
app.use('/tasks', taskRouter);
app.use('/discussion', discussionRouter);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

