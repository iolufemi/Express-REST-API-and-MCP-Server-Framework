process.env.RATE_LIMIT = '10';

import chai from 'chai';
chai.should();
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
import request from 'supertest';
import express from 'express';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);

import config from '../../src/config/index.js';
import router from '../../src/routes/index.js';

const app4 = express();
app4.use('/', router);

const agent4 = request.agent(app4);

const res: any = {};
const req: any = {};
let nextChecker = false;
const next = function () {
  if (arguments.length > 0) {
    console.log((arguments as any)[0]);
  } else {
    nextChecker = true;
  }
  return nextChecker;
};
res.json = function (data: any) {
  return res;
};
res.badRequest = sinon.spy();
res.status = function (status: number) {
  return res;
};
const header: any = {};
res.set = function (key: string, value: any) {
  header[key] = value;
  return header[key];
};
req.get = function (key: string) {
  return header[key];
};
header.set = function (data: any) {
  header.temp = data;
  return header.temp;
};
req.method = '';

describe('Router', function () {
  it('should contain a param function', function (done) {
    (router as any)._allRequestData(req, res, next);
    nextChecker.should.be.true; /* jslint ignore:line */
    nextChecker = false;
    req.param.should.be.a('function');
    done();
  });
});

describe('Cache Test', function () {
  it('should initialize the API cache', function (done) {
    res.set = sinon.spy();
    (router as any)._APICache(req, res, next);
    nextChecker.should.be.true; /* jslint ignore:line */
    nextChecker = false;
    req.cache.should.be.a('object');
    req.cacheKey.should.be.a('array');
    res.set.should.be.called.once; /* jslint ignore:line */
    res.set.should.be.calledWith({
      'Cache-Control': 'private, max-age=' + config.frontendCacheExpiry + ''
    });
    done();
  });
});
