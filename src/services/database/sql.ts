import config from '../../config/index.js';
import log from '../logger/index.js';
import mongoose from 'mongoose';
import { Sequelize, Op } from 'sequelize';
import debug from 'debug';

const debugLog = debug('sql');

// Enable only operators that you need
// @ts-ignore - Reserved for future use
const _operatorsAliases = {
  $gt: Op.gt,
  $gte: Op.gte,
  $lt: Op.lt,
  $lte: Op.lte,
  $like: Op.like
};

interface SequelizeOptions {
  host: string;
  port: number;
  dialect: 'mysql' | 'sqlite' | 'postgres' | 'mssql';
  pool: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
  };
  timezone: string;
  logging?: (log: string) => void;
}

const options: SequelizeOptions = {
  host: config.SQLHost,
  port: config.SQLPort,
  dialect: config.SQLDriver,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  timezone: config.SQLTimezone,
  logging: (logMessage: string) => {
    return (process.env.NODE_ENV === 'production') ? false : debugLog(logMessage);
  }
};

const sequelize = new Sequelize(config.SQLDatabase, config.SQLUsername || 'root', config.SQLPassword || undefined, options);

sequelize
  .authenticate()
  .then(() => {
    log.info('SQL database connection successful');
  })
  .catch((err: Error) => {
    log.error('Unable to connect to the database: ', err);
  });

export default sequelize;
export const _sequelize = Sequelize;
export const _mongoose = mongoose;
