import log from '../logger/index.js';
import { ExpressRequest, ExpressResponse } from '../../types/express.js';

export default function forbidden(this: ExpressResponse, data?: any, message?: string): void {
  log.warn('Sending forbidden response: ', data, message || 'forbidden');
  const req = this.req as ExpressRequest;
  const res = this;

  // Dump it in the queue
  const response: any = { response: { status: 'error', data: data, message: message ? message : 'forbidden' } };
  response.requestId = req.requestId;

  // Queue logging will be handled by Bull queue later
  // queue.create('logResponse', response).save();

  let processedData = data;
  if (data !== undefined && data !== null) {
    if (Object.keys(data).length === 0 && JSON.stringify(data) === JSON.stringify({})) {
      processedData = data.toString();
    }
  }

  if (processedData) {
    res.status(403).json({ status: 'error', data: processedData, message: message ? message : 'forbidden' });
  } else {
    res.status(403).json({ status: 'error', message: message ? message : 'forbidden' });
  }
}
