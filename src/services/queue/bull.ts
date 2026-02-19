import Bull from 'bull';
import log from '../logger/index.js';
import { queueConfig } from './queue.config.js';
import { QueueJobData, BullQueue, BullJob } from '../../types/queue.js';

// Create Bull queue instances for each job type
const createQueue = (name: string): BullQueue => {
  return new Bull<QueueJobData>(name, queueConfig);
};

// Main queues
export const searchIndexQueue = createQueue('searchIndex');
export const logRequestQueue = createQueue('logRequest');
export const logResponseQueue = createQueue('logResponse');
export const saveToTrashQueue = createQueue('saveToTrash');
export const sendWebhookQueue = createQueue('sendWebhook');
export const sendHTTPRequestQueue = createQueue('sendHTTPRequest');

// Queue registry
const queues: Record<string, BullQueue> = {
  searchIndex: searchIndexQueue,
  logRequest: logRequestQueue,
  logResponse: logResponseQueue,
  saveToTrash: saveToTrashQueue,
  sendWebhook: sendWebhookQueue,
  sendHTTPRequest: sendHTTPRequestQueue
};

// Event handlers for all queues
Object.keys(queues).forEach((queueName) => {
  const queue = queues[queueName];

  queue.on('error', (error: Error) => {
    log.error(`Queue ${queueName} error:`, error);
  });

  queue.on('waiting', (jobId: string) => {
    log.info(`Job ${jobId} is waiting in queue ${queueName}`);
  });

  queue.on('active', (job: BullJob) => {
    log.info(`Job ${job.id} started processing in queue ${queueName}`);
  });

  queue.on('stalled', (job: BullJob) => {
    log.warn(`Job ${job.id} stalled in queue ${queueName}`);
  });

  queue.on('completed', (job: BullJob, result: any) => {
    log.info(`Job ${job.id} completed in queue ${queueName}`, result);
  });

  queue.on('failed', (job: BullJob | undefined, error: Error) => {
    log.error(`Job ${job?.id || 'unknown'} failed in queue ${queueName}:`, error);
  });

  queue.on('paused', () => {
    log.info(`Queue ${queueName} paused`);
  });

  queue.on('resumed', () => {
    log.info(`Queue ${queueName} resumed`);
  });

  queue.on('cleaned', (jobs: BullJob[], type: string) => {
    log.info(`Cleaned ${jobs.length} ${type} jobs from queue ${queueName}`);
  });
});

// Note: Graceful shutdown is handled by src/services/shutdown.ts
// Queue shutdown is coordinated through the main shutdown handler

// Get queue by name
export function getQueue(name: string): BullQueue {
  return queues[name] || createQueue(name);
}

// Create a job in the specified queue
export function createJob(queueName: string, data: QueueJobData, options?: any): Promise<BullJob> {
  const queue = getQueue(queueName);
  return queue.add(data, options);
}

export default queues;
export { queues };
