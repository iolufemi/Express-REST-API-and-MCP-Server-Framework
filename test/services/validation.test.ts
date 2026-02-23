process.env.SECURE_MODE = 'true';

import chai from 'chai';
chai.should();
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
import express from 'express';
import request from 'supertest';
import response from '../../src/services/response/index.js';
import bodyParser from 'body-parser';

import validator from '../../src/services/validator/index.js';

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(response);

app.post(
  '/',
  function (req: any, res: any, next: any) {
    req._required = ['name', 'name2'];
    next();
  },
  validator,
  function (req: any, res: any) {
    res.ok('It worked!');
  }
);

const agent = request(app);

describe('#Validation service test', function () {
  it('should exist as a function', function (done) {
    validator.should.exist; /* jslint ignore:line */
    done();
  });

  it('should fail due to non existence of a required parameter', function (done) {
    agent.post('/').send({ name: 'femi' }).expect(400, done);
  });

  it('should be successful', function (done) {
    agent.post('/').send({ name: 'femi2', name2: 'femi' }).expect(200, done);
  });
});
