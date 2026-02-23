import log from '../logger/index.js';
import { ExpressRequest, ExpressResponse } from '../../types/express.js';

export default function serverError(this: ExpressResponse, data?: any, message?: string): void {
  log.error('sending server error response: ', data, message || 'server error');

  const req = this.req as ExpressRequest;
  const res = this;

  // Dump it in the queue
  const response: any = { response: { status: 'error', data: data, message: message ? message : 'server error' } };
  response.requestId = req.requestId;

  // Queue logging will be handled by Bull queue later
  // queue.create('logResponse', response).save();

  let processedData = data;
  if (data !== undefined && data !== null) {
    if (Object.keys(data).length === 0 && JSON.stringify(data) === JSON.stringify({})) {
      processedData = data.toString();
    }
  }

  let statusCode = 500;
  if (data?.statusCode) {
    statusCode = data.statusCode;
  }

  if (processedData) {
    res.status(statusCode).json({ status: 'error', data: processedData, message: message ? message : 'server error' });
  } else {
    res.status(statusCode).json({ status: 'error', message: message ? message : 'server error' });
  }
}
