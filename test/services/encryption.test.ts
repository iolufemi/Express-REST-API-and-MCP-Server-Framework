process.env.SECURE_MODE = 'true';

import chai from 'chai';
chai.should();
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
import crypto from 'crypto';

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

describe('#Encryption service test', function () {
  it('should have property generateKey, encrypt, decrypt and interpreter', function (done) {
    encryption.should.have.property('generateKey');
    encryption.should.have.property('encrypt');
    encryption.should.have.property('decrypt');
    encryption.should.have.property('interpreter');
    done();
  });

  it('should generate key', function (done) {
    encryption.generateKey().then((key: string) => {
      chai.expect(key).to.be.a('string');
      done();
    }).catch(done);
  });

  it('should encrypt and decrypt data', function (done) {
    encryption
      .generateKey()
      .then(function (resp) {
        header['x-tag'] = resp;
        return encryption.encrypt(demoData, req.get('x-tag'));
      })
      .then(function (resp) {
        res.set('encryptedData', resp.encryptedText);
        return encryption.decrypt(resp.encryptedText, req.get('x-tag'), resp.truth);
      })
      .then(function (resp) {
        resp.should.be.a('string');
        done();
      })
      .catch(function (err) {
        done(err);
      });
  });

  it('should detect compromised data', function (done) {
    encryption
      .decrypt('5b9f535be7edbad69ac03aced46f6586c1b2d', req.get('x-tag'), demoDataHash)
      .then(function (resp) {
        done(resp);
      })
      .catch(function (err: any) {
        if (err.message === 'Data integrity compromised!') {
          done();
        } else {
          done(err);
        }
      });
  });

  it('should interpret data when data is not POST', function (done) {
    encryption.interpreter(req, res, next);
    nextChecker.should.be.true; /* jslint ignore:line */
    nextChecker = false;
    done();
  });

  it('should interpret data when data is POST', function (done) {
    req.method = 'POST';
    req.body = {};
    req.body.secureData = req.get('encryptedData');
    req.body.truth = demoDataHash;
    encryption.interpreter(req, res, next);
    setTimeout(function () {
      nextChecker.should.be.true; /* jslint ignore:line */
      nextChecker = false;
    }, 1000);
    done();
  });
});
