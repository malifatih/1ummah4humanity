import { createApp } from './server.js';
import { env } from './config/env.js';
import { redis } from './config/redis.js';
import { prisma } from './config/database.js';
import { setupWebSocket } from './websocket/index.js';
import http from 'http';

async function main() {
  // Connect to Redis
  await redis.connect();

  // Verify database connection
  await prisma.$connect();
  console.log('Connected to PostgreSQL');

  const app = createApp();
  const server = http.createServer(app);

  // Setup WebSocket
  setupWebSocket(server);

  server.listen(env.PORT, () => {
    console.log(`1Ummah API server running on port ${env.PORT}`);
    console.log(`Environment: ${env.NODE_ENV}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    server.close();
    await prisma.$disconnect();
    redis.disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
