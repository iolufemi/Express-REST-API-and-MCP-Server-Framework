import { createClient } from 'redis';
import config from '../../config/index.js';
import log from '../logger/index.js';

const client = createClient({
  url: config.redisURL
});

client.on('error', (err: Error) => {
  log.error(err);
});

client.on('connect', () => {
  log.info('Redis database connection successful');
});

// Connect to Redis
client.connect().catch((err: Error) => {
  log.error('Redis connection error: ', err);
});

export default client;
