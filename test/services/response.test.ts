import chai from 'chai';
chai.should();
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
import crypto from 'crypto';
import express from 'express';
import bodyParser from 'body-parser';
import request from 'supertest';

import config from '../../src/config/index.js';
import response from '../../src/services/response/index.js';
import routerPromise from '../../src/routes/index.js';
import encryption from '../../src/services/encryption/index.js';

const res: any = {};
const req: any = {};
const demoData = '{"el escribimos": "silencio es dorado"}';
const demoDataHash = crypto.createHash('sha512').update(demoData).digest('hex');

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

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(response);

before(async function () {
  this.timeout(10000);
  const mainRouter = await routerPromise;
  app.use((mainRouter as unknown as { _APICache: express.RequestHandler })._APICache);
});

app.get('/ok', function (req: any, res: any) {
  res.ok('It worked!');
});
app.get('/badRequest', function (req: any, res: any) {
  res.badRequest('It worked!');
});
app.get('/forbidden', function (req: any, res: any) {
  res.forbidden('It worked!');
});
app.get('/notFound', function (req: any, res: any) {
  res.notFound('It worked!');
});
app.get('/serverError', function (req: any, res: any) {
  res.serverError('It worked!');
});
app.get('/unauthorized', function (req: any, res: any) {
  res.unauthorized('It worked!');
});
app.get('/unprocessable', function (req: any, res: any) {
  res.unprocessable('It worked!');
});

const app2 = express();
app2.use(bodyParser.urlencoded({ extended: false }));
app2.use(bodyParser.json());
app2.use(response);
app2.use(encryption.interpreter);
app2.post('/secure', function (req: any, res: any) {
  res.ok('It worked!');
});

const agent = request(app);
const agent2 = request(app2);

import '../../src/services/queue/workers.js';

describe('#Response service test', function () {
  before(function () {
    /* jslint ignore:line */
  });

  it('should add property ok, badRequest, forbidden, notFound, serverError and unauthorized to res object', function (done) {
    response(req, res, next);
    nextChecker = false;
    res.should.have.property('ok');
    res.should.have.property('badRequest');
    res.should.have.property('forbidden');
    res.should.have.property('notFound');
    res.should.have.property('serverError');
    res.should.have.property('unauthorized');
    res.should.have.property('unprocessable');
    done();
  });

  it('should be ok', function (done) {
    agent.get('/ok').expect(200, done);
  });

  if (config.noFrontendCaching !== 'yes') {
    it('should be a cached response', function (done) {
      agent
        .get('/ok')
        .expect(200)
        .then(() => agent.get('/ok').expect(200))
        .then(function (res: any) {
          if (res.body && 'cached' in res.body) {
            res.body.cached.should.equal(true);
          }
          done();
        })
        .catch(function (err: unknown) {
          done(err);
        });
    });
  }

  it('should be a badRequest', function (done) {
    agent.get('/badRequest').expect(400, done);
  });
  it('should be forbidden', function (done) {
    agent.get('/forbidden').expect(403, done);
  });
  it('should not be found', function (done) {
    agent.get('/notFound').expect(404, done);
  });
  it('should be unauthorized', function (done) {
    agent.get('/unauthorized').expect(401, done);
  });
  it('should be a serverError', function (done) {
    agent.get('/serverError').expect(500, done);
  });
  it('should be an unprocessable entity response', function (done) {
    agent.get('/unprocessable').expect(422, done);
  });

  it('should be an encrypted response', function (done) {
    let tag: string;
    encryption
      .generateKey()
      .then(function (res) {
        tag = res;
        return encryption.encrypt(demoData, tag);
      })
      .then(function (res) {
        return agent2
          .post('/secure')
          .set('x-tag', tag)
          .send({ truth: res.truth, secureData: res.encryptedText, secure: true })
          .expect(200);
      })
      .then(function (res) {
        const data = res.body;
        data.secure.should.be.true; /* jslint ignore:line */
        done();
      })
      .catch(function (err) {
        done(err);
      });
  });

  it('should detect tampered data', function (done) {
    let tag: string;
    encryption
      .generateKey()
      .then(function (res) {
        tag = res;
        const demoData2 = '{"escribimos": "silencios es dorado"}';
        return encryption.encrypt(demoData2, tag);
      })
      .then(function (res) {
        return agent2
          .post('/secure')
          .set('x-tag', tag)
          .send({ truth: demoDataHash, secureData: res.encryptedText, secure: true })
          .expect(400);
      })
      .then(function (_res) {
        done();
      })
      .catch(function (err) {
        done(err);
      });
  });
});
