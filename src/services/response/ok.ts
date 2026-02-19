import log from '../logger/index.js';
import config from '../../config/index.js';
import encryption from '../encryption/index.js';
import debug from 'debug';
import type { ExpressRequest, ExpressResponse } from '../../types/express.js';

const debugLog = debug('response');

export default function ok(this: ExpressResponse, data: any, cache?: boolean, extraData?: any): void {
  debugLog('sending ok response');
  const req = this.req as ExpressRequest;
  const res = this as ExpressResponse;

  // Dump it in the queue
  const response: any = {};
  if (cache) {
    response.response = data;
    response.response.cached = cache;
  } else {
    response.response = { status: 'success', data: data };
  }

  if (extraData) {
    response.response = Object.assign(response.response, extraData);
  }

  response.requestId = req.requestId;

  // Encrypt response here
  if (req.get('x-tag') && req.method === 'POST' && config.secureMode && req.body?.secure === true && data) {
    debugLog('i want to encrypt');
    const key = req.get('x-tag') || '';
    debugLog('our encryption key: ', key);
    const text = JSON.stringify(data);
    debugLog('about to call encryption method');
    encryption.encrypt(text, key)
      .then((resp: any) => {
        debugLog('got response from encryption method: ', resp);
        log.info('Sending ok response: ', response.response);
        response.response.secure = true;
        response.response.data = resp.encryptedText;
        response.response.truth = resp.truth;
        res.status(200).json(response.response);
      })
      .catch((err: any) => {
        debugLog('got error from encryption method: ', err);
        res.serverError?.(err);
      });
  } else {
    log.info('Sending ok response: ', response.response);
    if (data) {
      // Only cache GET calls
      if (req.method === 'GET' && config.noFrontendCaching !== 'yes') {
        // If this is a cached response, show response else cache the response and show response.
        if (cache) {
          res.status(200).json(response.response);
        } else {
          // req.cacheKey
          if (req.cache && req.cacheKey) {
            req.cache.set(req.cacheKey, response.response)
              .then(() => {
                res.status(200).json(response.response);
              })
              .catch((err: any) => {
                log.error('Failed to cache data: ', err);
                // This error shouldn't stop our response
                res.status(200).json(response.response);
              });
          } else {
            res.status(200).json(response.response);
          }
        }
      } else {
        res.status(200).json(response.response);
      }
    } else {
      res.status(200).json(response.response);
    }
  }

  // Queue logging will be handled by Bull queue later
  // queue.create('logResponse', response).save();
}
