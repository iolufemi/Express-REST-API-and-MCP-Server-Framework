import { CronJob } from 'cron';
import log from '../logger/index.js';
import Model from './Model.js';
import { getQueue, createJob } from './bull.js';
import config from '../../config/index.js';

/** CronJob expects timeZone to be a string; omit when missing or non-string to avoid .toLowerCase() errors. */
const clockTimeZone =
  typeof config.clockTimezone === 'string' && config.clockTimezone !== ''
    ? config.clockTimezone
    : undefined;

/** Create a CronJob from an options object. Uses CronJob.from() under the hood (cron v3 API). */
function createCronJob(params: {
  cronTime: string;
  onTick: () => void | Promise<void>;
  start?: boolean;
  timeZone?: string;
}): unknown {
  const opts: { cronTime: string; onTick: () => void | Promise<void>; start: boolean; timeZone?: string } = {
    cronTime: params.cronTime,
    onTick: params.onTick,
    start: params.start ?? true
  };
  if (params.timeZone) opts.timeZone = params.timeZone;
  return (CronJob as any).from(opts);
}

log.info('Starting Queue Clock...');

Model.find({ enabled: true })
  .then((jobs) => {
    jobs.forEach((job) => {
      const cronTime =
        job.crontab != null && job.crontab !== ''
          ? String(job.crontab)
          : null;
      if (!cronTime) {
        log.warn('Skipping clock job "' + job.name + '": crontab is missing or empty.');
        return;
      }
      log.info('Initializing ' + job.name + '...');

      try {
        const onTick = async (): Promise<void> => {
          try {
            const resp = await Model.findOne({ _id: job._id, enabled: true });
            if (!resp) {
              throw { notEnabled: true };
            }
            log.info('Pushing ' + job.name + ' to queue...');
            await createJob(job.job, job.arguments || {});
            resp.lastRunAt = new Date();
            await resp.save();
          } catch (err: any) {
            if (err.notEnabled) {
              log.info(job.name + ' is not enabled. Skipping...');
            } else {
              log.error('An error occurred while running Job - ' + job.name, err);
            }
          }
        };
        createCronJob({
          cronTime,
          onTick,
          start: true,
          ...(clockTimeZone ? { timeZone: clockTimeZone } : {})
        });
      } catch (err: any) {
        log.error('Invalid crontab for job "' + job.name + '" (crontab: ' + cronTime + '). Skipping. Error: ' + (err?.message ?? err));
      }
    });
  })
  .catch((err: Error) => {
    log.error('An error occurred while starting the queue clock: ', err);
  });

if (config.cleanUpFailedJobs === 'yes') {
  const cleanupOnTick = async (): Promise<void> => {
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
  };
  createCronJob({
    cronTime: '*/5 * * * *',
    onTick: cleanupOnTick,
    start: true,
    ...(clockTimeZone ? { timeZone: clockTimeZone } : {})
  });
}
