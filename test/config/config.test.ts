import chai from 'chai';
chai.should();

import config from '../../src/config/index.js';

describe('#Config test', function () {
  it('should be an object', function (done) {
    config.should.be.an('object');
    done();
  });
});
