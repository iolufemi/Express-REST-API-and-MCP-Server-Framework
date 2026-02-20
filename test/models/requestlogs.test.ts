import chai from 'chai';
chai.should();
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);
import fnv from 'fnv-plus';

import RequestLog from '../../src/models/RequestLogs.js';
import '../../src/services/queue/workers.js';

const objId1 = fnv.hash(new Date().valueOf() + '59abab38ead925031a714961', 128).str();
const objId2 = fnv.hash(new Date().valueOf() + '59abab38ead925031a714962', 128).str();
const objId3 = fnv.hash(new Date().valueOf() + '59abab38ead925031a714963', 128).str();
const objId4 = fnv.hash(new Date().valueOf() + '59abab38ead925031a714964', 128).str();

describe('RequestLog Model', function () {
  let id: any;
  let id2: any;

  before(function () {
    /* jslint ignore:line */
  });

  describe('Test CRUDS', function () {
    it('should save data', function (done) {
      const myrequestlog = RequestLog.create({
        RequestId: objId1,
        ipAddress: '192.168.90.9',
        url: 'http://google.com',
        method: 'POST',
        body: { name: 'femi' },
        createdAt: new Date()
      });

      myrequestlog
        .then(function (res: any) {
          res.should.be.an('object');
          done();
        })
        .catch(function (err: any) {
          done(err);
        });
    });

    it('should read data', function (done) {
      const myrequestlog = RequestLog.findOne({ RequestId: objId1 });

      myrequestlog
        .then(function (res: any) {
          res.should.be.an('object');
          done();
        })
        .catch(function (err: any) {
          done(err);
        });
    });

    it('should read all data', function (done) {
      const myrequestlog = RequestLog.find();

      myrequestlog
        .then(function (res: any) {
          res.should.be.an('array');
          done();
        })
        .catch(function (err: any) {
          done(err);
        });
    });

    it('should update data', function (done) {
      const cb = sinon.spy();
      const myrequestlog = RequestLog.updateMany({ RequestId: objId1 }, { RequestId: objId2 });

      myrequestlog
        .then(function (_res: any) {
          cb();
          chai.expect((cb as sinon.SinonSpy).calledOnce).to.be.true;
          done();
        })
        .catch(function (err: any) {
          done(err);
        });
    });

    it('should update many data', function (done) {
      const cb = sinon.spy();
      const myrequestlog = RequestLog.updateMany({ RequestId: objId2 }, { RequestId: objId3 });

      myrequestlog
        .then(function (_res: any) {
          cb();
          chai.expect((cb as sinon.SinonSpy).calledOnce).to.be.true;
          done();
        })
        .catch(function (err: any) {
          done(err);
        });
    });

    it('should search data', function (done) {
      const myrequestlog = RequestLog.search('gftgd');

      myrequestlog
        .then(function (res: any) {
          (Array.isArray(res) ? res : res).should.be.ok;
          if (Array.isArray(res)) res.should.be.an('array');
          else res.should.be.an('object');
          done();
        })
        .catch(function (err: any) {
          done(err);
        });
    });

    it('should delete data', function (done) {
      const cb2 = sinon.spy();
      const ourrequestlog = RequestLog.create([
        {
          RequestId: objId2,
          ipAddress: '192.168.90.9',
          url: 'http://google.com',
          method: 'POST',
          body: { name: 'femi' },
          createdAt: new Date()
        },
        {
          RequestId: objId1,
          ipAddress: '192.168.90.9',
          url: 'http://google.com',
          method: 'POST',
          body: { name: 'fqwwemi' },
          createdAt: new Date()
        }
      ]);
      const myrequestlog = RequestLog.deleteOne({ RequestId: objId1 });

      ourrequestlog
        .then(function (res: any) {
          (Array.isArray(res) ? res : res).should.be.ok;
          return myrequestlog;
        })
        .then(function (_res: any) {
          cb2();
          chai.expect((cb2 as sinon.SinonSpy).calledOnce).to.be.true;
          done();
        })
        .catch(function (err: any) {
          done(err);
        });
    });

    it('should delete many data', function (done) {
      const cb = sinon.spy();
      const myrequestlog = RequestLog.deleteMany({ RequestId: objId2 });

      myrequestlog
        .then(function (_res: any) {
          cb();
          chai.expect((cb as sinon.SinonSpy).calledOnce).to.be.true;
          done();
        })
        .catch(function (err: any) {
          done(err);
        });
    });

    it('should add createdAt', function (done) {
      const myrequestlog = RequestLog.create({ RequestId: objId2 });

      myrequestlog
        .then(function (res: any) {
          id = res._id;
          res.should.have.property('createdAt');
          done();
        })
        .catch(function (err: any) {
          done(err);
        });
    });

    it('should add updatedAt', function (done) {
      const uniqueIdForCreate = fnv.hash(new Date().valueOf() + 'updatedAt-create', 128).str();
      const uniqueIdForUpdate = fnv.hash(new Date().valueOf() + 'updatedAt-update', 128).str();
      const myrequestlog = RequestLog.create({ RequestId: uniqueIdForCreate });
      myrequestlog
        .then(function (res: any) {
          id2 = res._id;
          return RequestLog.updateMany({ _id: id }, { RequestId: uniqueIdForUpdate });
        })
        .then(function () {
          return RequestLog.findOne({ _id: id });
        })
        .then(function (res: any) {
          chai.expect(res).to.not.be.null;
          res!.should.have.property('updatedAt');
          done();
        })
        .catch(function (err: any) {
          done(err);
        });
    });

    it('should count returned records', function (done) {
      const myrequestlog = RequestLog.estimatedDocumentCount({ RequestId: objId2 });

      myrequestlog
        .then(function (res: any) {
          res.should.be.a('number');
          done();
        })
        .catch(function (err: any) {
          done(err);
        });
    });

    it('should find a record by id', function (done) {
      const myrequestlog = RequestLog.findById(id);

      myrequestlog
        .then(function (res: any) {
          res.should.be.an('object');
          done();
        })
        .catch(function (err: any) {
          done(err);
        });
    });

    it('should find a record by id and delete', function (done) {
      const myrequestlog = RequestLog.findByIdAndDelete(id2);

      myrequestlog
        .then(function (res: any) {
          if (res != null) res.should.be.an('object');
          done();
        })
        .catch(function (err: any) {
          done(err);
        });
    });

    it('should find a record by id and update', function (done) {
      const myrequestlog = RequestLog.findByIdAndUpdate(id, { name: 'fufu' });

      myrequestlog
        .then(function (res: any) {
          res.should.be.an('object');
          done();
        })
        .catch(function (err: any) {
          done(err);
        });
    });

    it('should find the first match from a query', function (done) {
      const myrequestlog = RequestLog.findOne({ RequestId: objId4 });

      myrequestlog
        .then(function (res: any) {
          if (res != null) res.should.be.an('object');
          done();
        })
        .catch(function (err: any) {
          done(err);
        });
    });

    it('should find the first match from a query and update', function (done) {
      const myrequestlog = RequestLog.findOneAndUpdate({ RequestId: objId4 }, { RequestId: objId1 });

      myrequestlog
        .then(function (res: any) {
          if (res != null) res.should.be.an('object');
          done();
        })
        .catch(function (err: any) {
          done(err);
        });
    });

    it('should find the first match from a query and delete', function (done) {
      const myrequestlog = RequestLog.findOneAndDelete({ RequestId: objId1 });

      myrequestlog
        .then(function (res: any) {
          if (res != null) res.should.be.an('object');
          done();
        })
        .catch(function (err: any) {
          done(err);
        });
    });
  });
});
