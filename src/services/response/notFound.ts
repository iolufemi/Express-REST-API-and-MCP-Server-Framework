import log from '../logger/index.js';
import { ExpressRequest, ExpressResponse } from '../../types/express.js';

export default function notFound(this: ExpressResponse): void {
  log.warn('Sending 404 response: ' + 'not found');
  const req = this.req as ExpressRequest;
  const res = this;

  // Dump it in the queue
  const response: any = { response: { status: 'error', message: 'not found' } };
  response.requestId = req.requestId;

  // Queue logging will be handled by Bull queue later
  // queue.create('logResponse', response).save();

  res.status(404).json({ status: 'error', message: 'not found' });
}
