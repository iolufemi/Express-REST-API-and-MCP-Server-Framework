import chai from 'chai';
chai.should();
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

import initialize from '../../src/controllers/Initialize.js';

describe('Initialize controller', function () {
  it('should return a string', function (done) {
    const next = function (err: unknown) {
      done(err);
    };
    const res: any = {};
    res.ok = function (data: unknown) {
      chai.expect(data).to.be.an('object');
      chai.expect(data).to.have.property('x-tag');
      (data as { 'x-tag': string })['x-tag'].should.be.a('string');
      done();
    };
    const req = undefined;
    initialize.init(req, res, next);
  });
});
