import { getQueue, createJob } from './bull.js';
import { QueueJobData, BullQueue, BullJob } from '../../types/queue.js';
import Model from './Model.js';
import log from '../logger/index.js';

// Export queue functions compatible with old Kue API
const queue = {
  // Create a job (compatible with Kue API)
  create: (jobName: string, data: QueueJobData, options?: any): { save: () => Promise<BullJob> } => {
    return {
      save: async () => {
        return createJob(jobName, data, options);
      }
    };
  },

  // Get queue by name
  getQueue: (name: string): BullQueue => {
    return getQueue(name);
  },

  // Add schedule (for clock jobs)
  addSchedule: async (crontab: string, name: string, job: string, data: any): Promise<void> => {
    try {
      await Model.create({ crontab, name, job, arguments: data });
    } catch (err: any) {
      log.error('Error scheduling job - ', err);
    }
  }
};

export default queue;
export { getQueue, createJob };
