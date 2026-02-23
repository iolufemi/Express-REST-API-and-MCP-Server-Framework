/**
 * Example: Custom Bull Queue Job
 *
 * This example shows how to create and process custom queue jobs.
 * Register the job name in src/services/queue/jobs.ts and add a handler in src/services/queue/workers.ts.
 */

import queue from '../src/services/queue/index.js';
import type { QueueJobData } from '../src/types/queue.js';

/**
 * Create a custom job
 */
export async function createCustomJob(data: QueueJobData): Promise<void> {
  await queue.create('customJob', data).save();
}

/**
 * Process custom jobs (add to workers.ts)
 */
export async function processCustomJob(jobData: QueueJobData): Promise<any> {
  console.log('Processing custom job:', jobData);
  
  // Your custom job logic here
  // ...

  return { success: true, processedAt: new Date() };
}

// Example usage:
// await createCustomJob({ userId: '123', action: 'process' });
