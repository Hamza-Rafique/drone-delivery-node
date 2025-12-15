import { startServer } from './app';
import mongoose from 'mongoose';

startServer();

process.on('SIGINT', async () => {
  console.log('🛑 Shutting down...');
  await mongoose.connection.close();
  process.exit(0);
});
