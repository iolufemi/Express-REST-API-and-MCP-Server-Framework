import logMongo, { _mongoose as logMongoose } from './logMongo.js';
import mongo, { _mongoose as mainMongoose } from './mongo.js';
import redis from './redis.js';
import api, { _mongoose as apiMongoose } from './api.js';
import sql, { _sequelize, _mongoose as sqlMongoose } from './sql.js';

const databases = {
  logMongo,
  mongo,
  redis,
  api,
  sql,
  _mongoose: mainMongoose,
  _logMongoose: logMongoose,
  _apiMongoose: apiMongoose,
  _sqlMongoose: sqlMongoose,
  _sequelize
};

export default databases;
