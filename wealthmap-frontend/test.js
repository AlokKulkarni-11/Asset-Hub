const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/assets',
  method: 'GET',
};

// we can't easily fetch without auth token, wait.
