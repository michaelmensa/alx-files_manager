const express = require('express');
const routes = require('./routes/index');
// use body-parser to parse JSON data sent in request body
const bodyParser = require('body-parser');

const app = express();

// Middleware to parse JSON bodies
const parser = app.use(bodyParser.json());

app.use('/', routes);

app.listen(5000, () => {
  console.log('Server running on port 5000');
});

module.exports = parser;
