import chai from 'chai';
chai.should();
import chaiAsPromised from 'chai-as-promised';
// chai.use(chaiAsPromised);
import mongooseMock from 'mongoose-mock';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);

import Trash from '../../src/models/Trash.js';
import '../../src/services/queue/workers.js';

describe('Trash Model', function () {
  let id: any;
  let id2: any;

  before(function () {
    /* jslint ignore:line */
  });

  describe('Test CRUDS', function () {
    it('should save data', function (done) {
      const mytrash = Trash.create({
        data: {
          RequestId: 'gdfd6563',
          ipAddress: '192.168.90.9',
          url: 'http://google.com',
          method: 'POST',
          body: { name: 'femi' },
          createdAt: new Date()
        }
      });

      mytrash
        .then(function (res: any) {
          res.should.be.an.object; /* jslint ignore:line */
          done();
        })
        .catch(function (err: any) {
          done(err);
        });
    });

    it('should read data', function (done) {
      const mytrash = Trash.findOne({ 'data.RequestId': 'gdfd6563' });

      mytrash
        .then(function (res: any) {
          res.should.be.an.object; /* jslint ignore:line */
          done();
        })
        .catch(function (err: any) {
          done(err);
        });
    });

    it('should read all data', function (done) {
      const mytrash = Trash.find();

      mytrash
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
      const mytrash = Trash.updateMany(
        { 'data.RequestId': 'gdfd6563' },
        { 'data.RequestId': 'gfdvdt09876543456789' }
      );

      mytrash
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
      const mytrash = Trash.updateMany(
        { 'data.RequestId': 'gfdvdt09876543456789' },
        { 'data.RequestId': 'kokoko456789' }
      );

      mytrash
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
      const mytrash = Trash.search('kokoko456789');

      mytrash
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
      const ourtrash = Trash.create([
        {
          data: {
            RequestId: 'gdfd6563',
            ipAddress: '192.168.90.9',
            url: 'http://google.com',
            method: 'POST',
            body: { name: 'femi' },
            createdAt: new Date()
          }
        },
        {
          data: {
            RequestId: 'gsdfghjk98765dfd6563',
            ipAddress: '192.168.90.9',
            url: 'http://google.com',
            method: 'POST',
            body: { name: 'fe6mi' },
            createdAt: new Date()
          }
        },
        {
          data: {
            RequestId: 'gdf099olllojd6563',
            ipAddress: '192.168.90.9',
            url: 'http://google.com',
            method: 'POST',
            body: { name: 'femi4' },
            createdAt: new Date()
          }
        }
      ]);
      const mytrash = Trash.deleteOne({ 'data.RequestId': 'kokoko456789' });

      ourtrash
        .then(function (res: any) {
          res.should.be.an.object; /* jslint ignore:line */
          return mytrash;
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
      const mytrash = Trash.deleteMany({ 'data.RequestId': 'kokoko456789' });

      mytrash
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
      const mytrash = Trash.create({
        data: {
          RequestId: 'gdf099olllojd6563',
          ipAddress: '192.168.90.9',
          url: 'http://google.com',
          method: 'POST',
          body: { name: 'femi4' },
          createdAt: new Date()
        }
      });

      mytrash
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
      const mytrash = Trash.create({
        data: {
          RequestId: 'gdf099olllojd6563',
          ipAddress: '192.168.90.9',
          url: 'http://google.com',
          method: 'POST',
          body: { name: 'femi4' },
          createdAt: new Date()
        }
      });
      mytrash
        .then(function (res: any) {
          id2 = res._id;
          return Trash.updateMany({ _id: id }, { 'data.RequestId': 'kgtggokoko456789' });
        })
        .then(function (res: any) {
          return Trash.findOne({ _id: id });
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
      const mytrash = Trash.estimatedDocumentCount({ 'data.RequestId': 'kgtggokoko456789' });

      mytrash
        .then(function (res: any) {
          res.should.be.a.number; /* jslint ignore:line */
          done();
        })
        .catch(function (err: any) {
          done(err);
        });
    });

    it('should find a record by id', function (done) {
      const mytrash = Trash.findById(id);

      mytrash
        .then(function (res: any) {
          res.should.be.an.object; /* jslint ignore:line */
          done();
        })
        .catch(function (err: any) {
          done(err);
        });
    });

    it('should find a record by id and delete', function (done) {
      const mytrash = Trash.findByIdAndRemove(id2);

      mytrash
        .then(function (res: any) {
          res.should.be.an.object; /* jslint ignore:line */
          done();
        })
        .catch(function (err: any) {
          done(err);
        });
    });

    it('should find a record by id and update', function (done) {
      const mytrash = Trash.findByIdAndUpdate(id, { name: 'fufu' });

      mytrash
        .then(function (res: any) {
          res.should.be.an.object; /* jslint ignore:line */
          done();
        })
        .catch(function (err: any) {
          done(err);
        });
    });

    it('should find the first match from a query', function (done) {
      const mytrash = Trash.findOne({ 'data.RequestId': 'kgtggokoko456789' });

      mytrash
        .then(function (res: any) {
          res.should.be.an.object; /* jslint ignore:line */
          done();
        })
        .catch(function (err: any) {
          done(err);
        });
    });

    it('should find the first match from a query and update', function (done) {
      const mytrash = Trash.findOneAndUpdate(
        { 'data.RequestId': 'kgtggokoko456789' },
        { 'data.RequestId': 'kgtggohyu0900koko456789' }
      );

      mytrash
        .then(function (res: any) {
          res.should.be.an.object; /* jslint ignore:line */
          done();
        })
        .catch(function (err: any) {
          done(err);
        });
    });

    it('should find the first match from a query and delete', function (done) {
      const mytrash = Trash.findOneAndRemove({ 'data.RequestId': 'kgtggohyu0900koko456789' });

      mytrash
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
