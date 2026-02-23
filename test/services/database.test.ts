process.env.SECURE_MODE = 'true';

import chai from 'chai';
chai.should();
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

import databases from '../../src/services/database/index.js';

const { mongo, logMongo, redis } = databases;

describe('#Database Service test', function () {
  it('should return an object', function (done) {
    databases.should.be.an('object');
    done();
  });
});

describe('#MongoDB database service test', function () {
  it('should exist as a function', function (done) {
    mongo.should.exist; /* jslint ignore:line */
    done();
  });
});

describe('#MongoDB database service test', function () {
  it('should exist as a function', function (done) {
    logMongo.should.exist; /* jslint ignore:line */
    done();
  });
});

describe('#Redis database service test', function () {
  it('should exist as a function', function (done) {
    redis.should.exist; /* jslint ignore:line */
    done();
  });
});
