import chai from 'chai';
chai.should();
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
import request from 'supertest';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);

import response from '../../src/services/response/index.js';
import router from '../../src/routes/initialize.js';
import routers from '../../src/routes/index.js';
import express from 'express';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use((routers as any)._APICache);
app.use(response);
app.use('/', router);

const agent = request.agent(app);

describe('/initialize', function () {
  it('should return a string', function (done) {
    agent
      .get('/initialize')
      .then(function (resp) {
        resp.body.data['x-tag'].should.be.a('string');
        done();
      })
      .catch(function (err) {
        done(err);
      });
  });
});
