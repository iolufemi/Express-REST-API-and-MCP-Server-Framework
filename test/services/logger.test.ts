process.env.SECURE_MODE = 'true';

import chai from 'chai';
chai.should();
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);

import logger, { errorHandler } from '../../src/services/logger/index.js';

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

  it('should call info, warn, error, verbose, debug, silly, log without throwing', function () {
    logger.info('test info');
    logger.warn('test warn');
    logger.error('test error');
    logger.verbose('test verbose');
    logger.debug('test debug');
    logger.silly('test silly');
    logger.log('info', 'test log');
  });

  it('errorHandler should call res.notFound for 404', function () {
    const res: any = { notFound: sinon.spy() };
    errorHandler({ statusCode: 404 }, {} as any, res, () => {});
    chai.expect((res.notFound as sinon.SinonSpy).calledOnce).to.be.true;
  });

  it('errorHandler should call res.unauthorized for 401', function () {
    const res: any = { unauthorized: sinon.spy() };
    errorHandler({ statusCode: 401 }, {} as any, res, () => {});
    chai.expect((res.unauthorized as sinon.SinonSpy).calledOnce).to.be.true;
  });

  it('errorHandler should call res.badRequest for 400', function () {
    const res: any = { badRequest: sinon.spy() };
    errorHandler({ statusCode: 400 }, {} as any, res, () => {});
    chai.expect((res.badRequest as sinon.SinonSpy).calledOnce).to.be.true;
  });

  it('errorHandler should call res.forbidden for 403', function () {
    const res: any = { forbidden: sinon.spy() };
    errorHandler({ statusCode: 403 }, {} as any, res, () => {});
    chai.expect((res.forbidden as sinon.SinonSpy).calledOnce).to.be.true;
  });

  it('errorHandler should call res.unprocessable for 422', function () {
    const res: any = { unprocessable: sinon.spy() };
    errorHandler({ statusCode: 422 }, {} as any, res, () => {});
    chai.expect((res.unprocessable as sinon.SinonSpy).calledOnce).to.be.true;
  });

  it('errorHandler should call res.serverError for other errors', function () {
    const res: any = { serverError: sinon.spy() };
    errorHandler(new Error('unknown'), {} as any, res, () => {});
    chai.expect((res.serverError as sinon.SinonSpy).calledOnce).to.be.true;
  });
});
