import { getQueue } from './bull.js';
import jobs from './jobs.js';
import config from '../../config/index.js';
import log from '../logger/index.js';
import { BullJob } from '../../types/queue.js';

const concurrency = parseInt(config.workerConcurrency || '1', 10);

// Process searchIndex jobs
getQueue('searchIndex').process(concurrency, async (job: BullJob) => {
  return jobs.createSearchTags(job.data as any);
});

// Process logRequest jobs
getQueue('logRequest').process(concurrency, async (job: BullJob) => {
  return jobs.createRequestLog(job.data as any);
});

// Process logResponse jobs
getQueue('logResponse').process(concurrency, async (job: BullJob) => {
  return jobs.updateRequestLog(job.data as any);
});

// Process saveToTrash jobs
getQueue('saveToTrash').process(concurrency, async (job: BullJob) => {
  return jobs.saveToTrash(job.data as any);
});

// Process sendWebhook jobs
getQueue('sendWebhook').process(concurrency, async (job: BullJob) => {
  return jobs.sendWebhook(job.data as any);
});

// Process sendHTTPRequest jobs
getQueue('sendHTTPRequest').process(concurrency, async (job: BullJob) => {
  return jobs.sendHTTPRequest(job.data as any);
});

log.info('Queue workers started with concurrency:', concurrency);
