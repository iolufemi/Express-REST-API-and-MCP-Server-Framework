import log from '../logger/index.js';
import { ExpressRequest, ExpressResponse } from '../../types/express.js';

export default function unprocessable(this: ExpressResponse, data?: any, message?: string): void {
  log.warn('Sending unprocessable entity response: ', data, message || 'unprocessable entity');
  const req = this.req as ExpressRequest;
  const res = this as ExpressResponse;

  // Dump it in the queue
  const response: any = { response: { status: 'error', data: data, message: message ? message : 'unprocessable entity' } };
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
    res.status(422).json({ status: 'error', data: processedData, message: message ? message : 'unprocessable entity' });
  } else {
    res.status(422).json({ status: 'error', message: message ? message : 'unprocessable entity' });
  }
}
