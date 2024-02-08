const express = require('express');
const routes = require('./routes/index');

const app = express();

app.use('/', routes);

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
