import config from '../../config/index.js';
import { QueueConfig } from '../../types/queue.js';

export const queueConfig: QueueConfig = {
  redis: config.redisURL,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 1000 // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 86400 // Keep failed jobs for 24 hours
    }
  }
};

export default queueConfig;
