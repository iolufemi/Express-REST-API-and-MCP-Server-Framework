import mongoose from 'mongoose';
import config from '../../config/index.js';
import log from '../logger/index.js';

// Connect to DB
const mongooseConfig: mongoose.ConnectOptions = {};

if (config.env === 'production') {
  mongooseConfig.autoIndex = false;
}

const db = mongoose.createConnection(config.mongoURL, mongooseConfig);

db.on('error', (err: Error) => {
  log.error(err);
});

db.once('open', () => {
  log.info('MongoDB database connection successful');
});

export default db;
export const _mongoose = mongoose;
