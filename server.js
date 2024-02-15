const express = require('express');
// const bodyParser = require('body-parser');
const routes = require('./routes/index');
// use body-parser to parse JSON data sent in request body

// port
const port = process.env.PORT || 5000;

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

app.use('/', routes);

app.listen(port, () => {
  console.log('Server running on port 5000');
});

// module.exports = parser;
