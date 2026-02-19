import { check, validationResult } from 'express-validator';
import debug from 'debug';
import { ExpressRequest, ExpressResponse, ExpressNext } from '../../types/express.js';

const debugLog = debug('validator');

export default async function validator(req: ExpressRequest, res: ExpressResponse, next: ExpressNext): Promise<void> {
  debugLog('starting validation check.');
  debugLog('What we got: ', req.body);
  const parameters = req._required || [];
  
  if (parameters.length) {
    const last = parameters.length - 1;
    for (let n = 0; n < parameters.length; n++) {
      if (parameters[n]) {
        debugLog('validating ' + parameters[n]);
        await check(parameters[n], parameters[n] + ' is required').trim().escape().notEmpty().run(req);

        if (n === last) {
          debugLog('parameters: ', parameters[n]);
          debugLog('validation over, lets take it home...');
          const errors = validationResult(req);
          if (!errors.isEmpty()) {
            res.badRequest?.(errors.array());
          } else {
            next();
          }
        }
      }
    }
  } else {
    next();
  }
}
