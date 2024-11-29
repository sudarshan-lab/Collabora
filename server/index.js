
const express = require('express');
const authRouter = require('./auth');
const teamRouter = require('./team-module');
const app = express();
const port = 3000;


app.use(express.json()); //Needed to parse JSON from POST requests
app.use('/auth', authRouter); // Mount the auth router
app.use('/team', teamRouter);


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});