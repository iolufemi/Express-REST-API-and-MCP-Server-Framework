import chai from 'chai';
chai.should();

import models from '../../src/models/index.js';

describe('#Models test', function () {
  it('should return an object', function (done) {
    models.should.be.an('object');
    done();
  });
});
