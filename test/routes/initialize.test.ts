import chai from 'chai';
chai.should();
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
import request from 'supertest';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);

import response from '../../src/services/response/index.js';
import router from '../../src/routes/initialize.js';
import express from 'express';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let agent: ReturnType<typeof request.agent>;
before(async function () {
  this.timeout(10000);
  app.use(response);
  app.use('/', router);
  agent = request.agent(app);
});

describe('/initialize', function () {
  it('should return a string', function (done) {
    agent!
      .get('/initialize')
      .expect(200)
      .then(function (resp) {
        chai.expect(resp.body).to.have.property('data');
        chai.expect(resp.body.data).to.have.property('x-tag');
        resp.body.data['x-tag'].should.be.a('string');
        done();
      })
      .catch(function (err) {
        done(err);
      });
  });
});
