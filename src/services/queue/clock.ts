import { CronJob } from 'cron';
import log from '../logger/index.js';
import Model from './Model.js';
import { getQueue, createJob } from './bull.js';
import config from '../../config/index.js';

log.info('Starting Queue Clock...');

Model.find({ enabled: true })
  .then((jobs) => {
    jobs.forEach((job) => {
      log.info('Initializing ' + job.name + '...');
      
      new CronJob({
        cronTime: job.crontab,
        onTick: async () => {
          // Check if job is enabled
          try {
            const resp = await Model.findOne({ _id: job._id, enabled: true });
            if (!resp) {
              throw { notEnabled: true };
            } else {
              log.info('Pushing ' + job.name + ' to queue...');
              await createJob(job.job, job.arguments || {});
              resp.lastRunAt = new Date();
              await resp.save();
            }
          } catch (err: any) {
            if (err.notEnabled) {
              log.info(job.name + ' is not enabled. Skipping...');
            } else {
              log.error('An error occurred while running Job - ' + job.name, err);
            }
          }
        },
        start: true,
        timeZone: config.clockTimezone
      });
    });
  })
  .catch((err: Error) => {
    log.error('An error occurred while starting the queue clock: ', err);
  });

if (config.cleanUpFailedJobs === 'yes') {
  new CronJob({
    cronTime: '*/5 * * * *',
    onTick: async () => {
      try {
        const queues = ['searchIndex', 'logRequest', 'logResponse', 'saveToTrash', 'sendWebhook', 'sendHTTPRequest'];
        for (const queueName of queues) {
          const queue = getQueue(queueName);
          const failedJobs = await queue.getFailed(0, 100);
          for (const job of failedJobs) {
            await job.remove();
            log.info('removed failed job #' + job.id + ' from queue ' + queueName);
          }
        }
      } catch (err: any) {
        log.error('Error cleaning up failed jobs: ', err);
      }
    },
    start: true,
    timeZone: config.clockTimezone
  });
}
