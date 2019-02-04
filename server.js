const express = require('express');
const mongoose = require('mongoose');
const chalk = require('chalk');

const users = require('./routes/api/users');
const profile = require('./routes/api/profile');
const posts = require('./routes/api/posts');

const app = express();

// Database config
const db = require('./config/keys').mongoURI;

// Connect to mongoDB
mongoose
  .connect(db, { useNewUrlParser: true })
  .then(() => console.log(chalk.blue('MongoDB connected')))
  .catch(err => console.error(chalk.red(err)));

const port = process.env.port || 5000;

app.get('/', (req, res) => res.send('Hello'));

// Use Routes
app.use('/api/users', users);
app.use('/api/profile', profile);
app.use('/api/posts', posts);

app.listen(port, () =>
  console.log(chalk.blue(`Server started on port ${port}`))
);
