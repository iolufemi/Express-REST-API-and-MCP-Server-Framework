process.env.SECURE_MODE = 'true';

import chai from 'chai';
chai.should();
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

import logger from '../../src/services/logger/index.js';

describe('#Logger service test', function () {
  it('should return an object', function (done) {
    logger.should.be.an('object');
    done();
  });

  it('should have property warn, error, info, verbose, debug, silly and log', function (done) {
    logger.should.be.have.property('warn');
    logger.should.be.have.property('error');
    logger.should.be.have.property('info');
    logger.should.be.have.property('log');
    logger.should.be.have.property('verbose');
    logger.should.be.have.property('debug');
    logger.should.be.have.property('silly');
    done();
  });
});
