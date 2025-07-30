import cron from 'node-cron';
import logger from '../logger';

const jobs = {
  dailyCleanup: cron.schedule(
    '0 0 * * *',
    () => {
      try {
        logger.info('Running daily cleanup job');
      } catch (error) {
        logger.error('Daily cleanup job failed:', error);
      }
    },
    {
      timezone: 'UTC'
    }
  ),

  weeklyReport: cron.schedule(
    '0 9 * * 1',
    () => {
      try {
        logger.info('Generating weekly report');
      } catch (error) {
        logger.error('Weekly report job failed:', error);
      }
    },
    {
      timezone: 'UTC'
    }
  ),

  syncData: cron.schedule(
    '*/30 * * * *',
    () => {
      try {
        logger.info('Syncing data');
      } catch (error) {
        logger.error('Data sync job failed:', error);
      }
    },
    {
      timezone: 'UTC'
    }
  )
};

const init = (): void => {
  try {
    if (process.env.NODE_ENV === 'production') {
      Object.entries(jobs).forEach(([name, job]) => {
        job.start();
        logger.info(`Started cron job: ${name}`);
      });
      logger.info('Cron jobs initialization completed');
    } else {
      logger.info('Cron jobs not started in development mode');
    }
  } catch (error) {
    logger.error('Failed to initialize cron jobs:', error);
  }
};

const stop = (): void => {
  try {
    Object.entries(jobs).forEach(([name, job]) => {
      job.destroy();
      logger.info(`Stopped cron job: ${name}`);
    });
    logger.info('All cron jobs stopped');
  } catch (error) {
    logger.error('Failed to stop cron jobs:', error);
  }
};

const getStatus = () => {
  return Object.entries(jobs).reduce(
    (status, [name]) => {
      status[name] = {
        exists: true
      };
      return status;
    },
    {} as Record<string, { exists: boolean }>
  );
};

const startJob = (jobName: string): boolean => {
  const job = jobs[jobName as keyof typeof jobs];
  if (job) {
    job.start();
    logger.info(`Started job: ${jobName}`);
    return true;
  }
  logger.error(`Job not found: ${jobName}`);
  return false;
};

const stopJob = (jobName: string): boolean => {
  const job = jobs[jobName as keyof typeof jobs];
  if (job) {
    job.stop();
    logger.info(`Stopped job: ${jobName}`);
    return true;
  }
  logger.error(`Job not found: ${jobName}`);
  return false;
};

export default {
  init,
  stop,
  jobs,
  getStatus,
  startJob,
  stopJob
};
