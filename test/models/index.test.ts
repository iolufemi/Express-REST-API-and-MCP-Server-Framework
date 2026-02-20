import chai from 'chai';
chai.should();

import modelsPromise from '../../src/models/index.js';

describe('#Models test', function () {
  it('should return an object', async function () {
    const models = await modelsPromise;
    chai.expect(models).to.be.an('object');
  });
});
