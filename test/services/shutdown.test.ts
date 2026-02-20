import chai from 'chai';
chai.should();
import http from 'http';
import { setServer, setupShutdownHandlers } from '../../src/services/shutdown.js';

describe('Shutdown service', function () {
  it('setServer should store the server reference', function () {
    const server = http.createServer(() => {});
    setServer(server);
    // No getter exposed; we just verify it doesn't throw
    setServer(server);
  });

  it('setupShutdownHandlers should register without throwing when called with no server', function () {
    setupShutdownHandlers();
  });

  it('setupShutdownHandlers should register without throwing when called with a server', function () {
    const server = http.createServer(() => {});
    setServer(server);
    setupShutdownHandlers(server);
  });
});
