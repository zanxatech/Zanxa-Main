require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocket } = require('./socket/socketServer');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 Zanxa Tech Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});

// Last Restart: 2026-04-14T01:14:00
module.exports = server;
