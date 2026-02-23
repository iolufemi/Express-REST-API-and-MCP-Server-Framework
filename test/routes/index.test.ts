process.env.RATE_LIMIT = '10';

import chai from 'chai';
chai.should();
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
import express from 'express';
import request from 'supertest';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);

import config from '../../src/config/index.js';
import routerPromise from '../../src/routes/index.js';

let router: Awaited<typeof routerPromise>;
const app4 = express();

let beforeCompleted = false;
let beforeError: Error | null = null;

before(async function () {
  this.timeout(15000);
  try {
    router = await routerPromise;
    chai.expect(router, 'routerPromise should resolve to a router').to.be.ok;
    app4.use('/', router);
    beforeCompleted = true;
  } catch (err) {
    beforeError = err instanceof Error ? err : new Error(String(err));
    throw beforeError;
  }
});

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
res.json = function (_data: unknown) {
  return res;
};
res.badRequest = sinon.spy();
res.status = function (_status: number) {
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
  it('before() completed and router is attached', function () {
    chai.expect(beforeError, 'before() should not have thrown').to.be.null;
    chai.expect(beforeCompleted, 'before() should have set beforeCompleted').to.be.true;
    chai.expect(router, 'router should be defined').to.be.ok;
    chai.expect(router, 'Express Router is callable').to.be.a('function');
    chai.expect(app4, 'app should be callable').to.be.a('function');
  });

  it('should contain a param function', function (done) {
    (router as any)._allRequestData(req, res, next);
    nextChecker.should.be.true; /* jslint ignore:line */
    nextChecker = false;
    req.param.should.be.a('function');
    done();
  });

  describe('GET /', function () {
    this.timeout(30000);

    it('step 1: request completes with status 200', function (done) {
      request(app4)
        .get('/')
        .then(function (res) {
          chai.expect(res.status, 'GET / should return 200').to.equal(200);
          done();
        })
        .catch(done);
    });

    it('step 2: response body has property data', function (done) {
      request(app4)
        .get('/')
        .then(function (res) {
          chai.expect(res.status).to.equal(200);
          chai.expect(res.body, 'response body').to.be.an('object');
          chai.expect(res.body, 'body.data').to.have.property('data');
          done();
        })
        .catch(done);
    });

    it('step 3: response body.data has name and version', function (done) {
      request(app4)
        .get('/')
        .then(function (res) {
          chai.expect(res.status).to.equal(200);
          chai.expect(res.body).to.have.property('data');
          chai.expect(res.body.data, 'data.name').to.have.property('name');
          chai.expect(res.body.data, 'data.version').to.have.property('version');
          done();
        })
        .catch(done);
    });
  });
});

describe('Cache Test', function () {
  it('should initialize the API cache when Redis is available', function (done) {
    const redisConfigured = !!config.redisURL;
    res.set = sinon.spy();
    req.method = 'POST';
    req.url = '/test';
    req.ip = '127.0.0.1';
    const nextCb = () => {
      nextChecker = true;
      const redisAvailable = (router as { _redisAvailable?: boolean })._redisAvailable;
      if (!redisConfigured) {
        this.skip();
        return;
      }
      if (!redisAvailable) {
        done(new Error('Redis is configured but router._redisAvailable is false; database import may have failed in createRouter.'));
        return;
      }
      chai.expect(req.cache, 'req.cache should be set when Redis is available').to.be.ok;
      req.cache.should.be.an('object');
      req.cacheKey.should.be.an('array');
      chai.expect((res.set as sinon.SinonSpy).calledOnce).to.be.true;
      chai.expect((res.set as sinon.SinonSpy).calledWith({
        'Cache-Control': 'private, max-age=' + config.frontendCacheExpiry + ''
      })).to.be.true;
      done();
    };
    try {
      (router as unknown as { _APICache: (req: unknown, res: unknown, next: () => void) => void })._APICache(req, res, nextCb);
    } catch (_err) {
      if (redisConfigured) done(_err as Error);
      else this.skip();
    }
  });
});
