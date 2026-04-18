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

// Graceful Shutdown
function shutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Shutting down server...`);
  server.close(() => {
    console.log('✅ Server closed. Releasing port 5000.');
    process.exit(0);
  });
  
  // Force exit if server doesn't close in 10s
  setTimeout(() => {
    console.log('⚠️ Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = server;
