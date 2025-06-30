import cron from 'node-cron';
import logger from '../logger';

// Example cron jobs
const jobs = {
  // Run every day at midnight
  dailyCleanup: cron.schedule('0 0 * * *', () => {
    try {
      logger.info('Running daily cleanup job');
      // Add your cleanup logic here
    } catch (error) {
      logger.error('Daily cleanup job failed:', error);
    }
  }, {
    timezone: 'UTC'
  }),
  
  // Run every Monday at 9am
  weeklyReport: cron.schedule('0 9 * * 1', () => {
    try {
      logger.info('Generating weekly report');
      // Add your reporting logic here
    } catch (error) {
      logger.error('Weekly report job failed:', error);
    }
  }, {
    timezone: 'UTC'
  }),
  
  // Run every 30 minutes
  syncData: cron.schedule('*/30 * * * *', () => {
    try {
      logger.info('Syncing data');
      // Add your data syncing logic here
    } catch (error) {
      logger.error('Data sync job failed:', error);
    }
  }, {
    timezone: 'UTC'
  })
};

// Initialize all cron jobs
const init = (): void => {
  try {
    // Only start cron jobs in production
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

// Stop all cron jobs
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

// Get job status
const getStatus = () => {
  return Object.entries(jobs).reduce((status, [name]) => {
    status[name] = {
      exists: true
    };
    return status;
  }, {} as Record<string, { exists: boolean }>);
};

// Start a specific job
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

// Stop a specific job
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