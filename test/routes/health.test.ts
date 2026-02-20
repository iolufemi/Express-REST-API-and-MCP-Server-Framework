import chai from 'chai';
chai.should();
import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import response from '../../src/services/response/index.js';
import healthRouter from '../../src/routes/health.js';

const app = express();
app.use(bodyParser.json());
app.use(response);
app.use('/health', healthRouter);

describe('/health', function () {
  it('GET /health should return health status', function (done) {
    request(app)
      .get('/health')
      .then(function (resp) {
        chai.expect([200, 503]).to.include(resp.status);
        chai.expect(resp.body).to.have.property('status');
        chai.expect(resp.body).to.have.property('databases');
        chai.expect(resp.body).to.have.property('queues');
        chai.expect(resp.body).to.have.property('timestamp');
        chai.expect(resp.body).to.have.property('uptime');
        chai.expect(['healthy', 'degraded', 'unhealthy']).to.include(resp.body.status);
        done();
      })
      .catch(done);
  });

  it('GET /health/ready should return readiness', function (done) {
    request(app)
      .get('/health/ready')
      .then(function (resp) {
        chai.expect(resp.body).to.have.property('ready');
        chai.expect(resp.body).to.have.property('timestamp');
        chai.expect([200, 503]).to.include(resp.status);
        done();
      })
      .catch(done);
  });

  it('GET /health/live should return 200 and alive', function (done) {
    request(app)
      .get('/health/live')
      .expect(200)
      .then(function (resp) {
        chai.expect(resp.body).to.have.property('alive', true);
        chai.expect(resp.body).to.have.property('timestamp');
        chai.expect(resp.body).to.have.property('uptime');
        done();
      })
      .catch(done);
  });
});
