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
    res.ok = function (data: any) {
      data.should.be.an.object; /* jslint ignore:line */
      data.should.have.property('x-tag');
      (data as any)['x-tag'].should.be.a('string'); /* jslint ignore:line */
      done();
    };
    const req = undefined;
    initialize.init(req, res, next);
  });
});
