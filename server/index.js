
const express = require('express');
const cors = require('cors');
const pool = require('./db'); 
const authRouter = require('./routes/auth');
const teamRouter = require('./routes/team-module');
const taskRouter = require('./routes/task-module');
const discussionRouter = require('./routes/discussion-module');
const fileRouter = require('./routes/file-module');
const notificationRouter = require('./routes/notificationRouter');
const app = express();
const port = 3000;

app.use(cors({
  origin: ['http://34.132.245.252:5173', 'http://localhost:5173'], 
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

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

