import chai from 'chai';
chai.should();
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
import sinonChai from 'sinon-chai';
chai.use(sinonChai);
import fnv from 'fnv-plus';
import mongoose from 'mongoose';
import express from 'express';

import queue, { getQueue } from '../../src/services/queue/index.js';
import jobs from '../../src/services/queue/jobs.js';
import '../../src/services/queue/workers.js';

let testServerPort = 8081;

describe('#Queue service', function () {
  before(function (done) {
    const app = express();
    app.all('/', function (_req: unknown, res: { json: (body: object) => void }) {
      res.json({ status: 'ok' });
    });
    const server = app.listen(0, function () {
      const addr = server.address();
      const port = addr && typeof addr !== 'string' ? addr.port : 8081;
      testServerPort = port;
      console.log('API server listening on port ' + testServerPort + '!');
      done();
    });
  });

  it('should return an object', function (done) {
    queue.should.be.an('object');
    queue.should.have.property('create');
    queue.should.have.property('getQueue');
    jobs.should.be.an('object');
    done();
  });

  it('should have getQueue', function () {
    const q = getQueue('searchIndex');
    chai.expect(q).to.exist;
  });

  describe('#Testing Jobs', function () {
    it('should run createRequestLog successfully', function (done) {
      const myrequestlog = {
        RequestId: fnv.hash(new Date().valueOf() + '59abab38ead925031a714967', 128).str(),
        ipAddress: '192.168.90.9',
        url: 'http://google.com',
        method: 'POST',
        body: { name: 'femi' },
        createdAt: new Date()
      };
      jobs.createRequestLog(myrequestlog as any).then(() => done()).catch(done);
    });

    it('should run updateRequestLog successfully', function (done) {
      const myrequestlog = {
        requestId: fnv.hash(new Date().valueOf() + '59abab38ead925031a714966', 128).str(),
        response: {
          ipAddress: '192.168.90.9',
          url: 'http://google.com',
          method: 'POST',
          body: { name: 'femi' },
          createdAt: new Date()
        }
      };
      jobs.updateRequestLog(myrequestlog as any).then(() => done()).catch(done);
    });

    it('should run createSearchTags successfully for saving data', function (done) {
      const myrequestlog = {
        RequestId: fnv.hash(new Date().valueOf() + '59abab38ead925031a714969', 128).str(),
        ipAddress: '192.168.90.9',
        url: 'http://google.com',
        method: 'POST',
        body: { name: 'femi' },
        createdAt: new Date()
      } as any;
      myrequestlog.model = 'RequestLogs';
      jobs.createSearchTags(myrequestlog).then(() => done()).catch(done);
    });

    it('should run createSearchTags successfully for updating data', function (done) {
      const myrequestlog = {
        RequestId: fnv.hash(new Date().valueOf() + '59abab38ead925031a714968', 128).str(),
        ipAddress: '192.168.90.9',
        url: 'http://google.com',
        method: 'POST',
        body: { name: 'femi' },
        createdAt: new Date()
      } as any;
      myrequestlog.model = 'RequestLogs';
      myrequestlog.update = true;
      jobs.createSearchTags(myrequestlog).then(() => done()).catch(done);
    });

    it('should run saveToTrash successfully for backing up data', function (done) {
      const backup = {
        data: {
          _id: new (mongoose.Types as any).ObjectId('59abab38ead925031a71496e'),
          name: 'foo'
        }
      };
      jobs.saveToTrash(backup as any).then(() => done()).catch(done);
    });

    it('should run sendWebhook successfully for sending realtime HTTP notifications', function (done) {
      const data = {
        reference: Date.now(),
        webhookURL: 'https://postman-echo.com/post',
        data: {
          someData: 'this',
          someOtherData: 'and this'
        }
      };
      jobs.sendWebhook(data as any).then(() => done()).catch(done);
    });

    it('should run sendHTTPRequest successfully for calling web services with POST method', function (done) {
      const data = {
        url: 'http://localhost:' + testServerPort,
        method: 'POST',
        headers: { 'User-Agent': 'Femi' },
        data: { someData: 'this', someOtherData: 'and this' }
      };
      jobs.sendHTTPRequest(data as any).then(() => done()).catch(done);
    });

    it('should run sendHTTPRequest successfully for calling web services with GET method', function (done) {
      const data = {
        url: 'http://localhost:' + testServerPort,
        method: 'GET',
        headers: { 'User-Agent': 'Femi' },
        data: { someData: 'this', someOtherData: 'and this' }
      };
      jobs.sendHTTPRequest(data as any).then(() => done()).catch(done);
    });

    it('should run sendHTTPRequest successfully for calling web services with PUT method', function (done) {
      const data = {
        url: 'http://localhost:' + testServerPort,
        method: 'PUT',
        headers: { 'User-Agent': 'Femi' },
        data: { someData: 'this', someOtherData: 'and this' }
      };
      jobs.sendHTTPRequest(data as any).then(() => done()).catch(done);
    });

    it('should run sendHTTPRequest successfully for calling web services with DELETE method', function (done) {
      const data = {
        url: 'http://localhost:' + testServerPort,
        method: 'DELETE',
        headers: { 'User-Agent': 'Femi' },
        data: { someData: 'this', someOtherData: 'and this' }
      };
      jobs.sendHTTPRequest(data as any).then(() => done()).catch(done);
    });

    it('should run sendHTTPRequest successfully for calling web services with PATCH method', function (done) {
      const data = {
        url: 'http://localhost:' + testServerPort,
        method: 'PATCH',
        headers: { 'User-Agent': 'Femi' },
        data: { someData: 'this', someOtherData: 'and this' }
      };
      jobs.sendHTTPRequest(data as any).then(() => done()).catch(done);
    });
  });
});
