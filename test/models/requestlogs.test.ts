import chai from 'chai';
chai.should();
import chaiAsPromised from 'chai-as-promised';
import mongooseMock from 'mongoose-mock';
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
          res.should.be.an.object; /* jslint ignore:line */
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
          res.should.be.an.object; /* jslint ignore:line */
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
          res.should.be.an.array; /* jslint ignore:line */
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
        .then(function (res: any) {
          cb();
          cb.should.have.been.calledOnce; /* jslint ignore:line */
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
        .then(function (res: any) {
          cb();
          cb.should.have.been.calledOnce; /* jslint ignore:line */
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
          res.should.be.an.object; /* jslint ignore:line */
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
          res.should.be.an.object; /* jslint ignore:line */
          return myrequestlog;
        })
        .then(function (res: any) {
          cb2();
          cb2.should.have.been.calledOnce; /* jslint ignore:line */
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
        .then(function (res: any) {
          cb();
          cb.should.have.been.calledOnce; /* jslint ignore:line */
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
      const myrequestlog = RequestLog.create({ RequestId: objId1 });
      myrequestlog
        .then(function (res: any) {
          id2 = res._id;
          return RequestLog.updateMany({ _id: id }, { RequestId: objId4 });
        })
        .then(function (res: any) {
          return RequestLog.findOne({ _id: id });
        })
        .then(function (res: any) {
          res.should.have.property('updatedAt');
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
          res.should.be.a.number; /* jslint ignore:line */
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
          res.should.be.an.object; /* jslint ignore:line */
          done();
        })
        .catch(function (err: any) {
          done(err);
        });
    });

    it('should find a record by id and delete', function (done) {
      const myrequestlog = RequestLog.findByIdAndRemove(id2);

      myrequestlog
        .then(function (res: any) {
          res.should.be.an.object; /* jslint ignore:line */
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
          res.should.be.an.object; /* jslint ignore:line */
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
          res.should.be.an.object; /* jslint ignore:line */
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
          res.should.be.an.object; /* jslint ignore:line */
          done();
        })
        .catch(function (err: any) {
          done(err);
        });
    });

    it('should find the first match from a query and delete', function (done) {
      const myrequestlog = RequestLog.findOneAndRemove({ RequestId: objId1 });

      myrequestlog
        .then(function (res: any) {
          res.should.be.an.object; /* jslint ignore:line */
          done();
        })
        .catch(function (err: any) {
          done(err);
        });
    });
  });
});
