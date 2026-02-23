import { ExpressRequest, ExpressResponse, ExpressNext } from '../../types/express.js';
import ok from './ok.js';
import badRequest from './badRequest.js';
import forbidden from './forbidden.js';
import notFound from './notFound.js';
import serverError from './serverError.js';
import unauthorized from './unauthorized.js';
import unprocessable from './unprocessable.js';

export default function responseMiddleware(_req: ExpressRequest, res: ExpressResponse, next: ExpressNext): void {
  const responseTypes = {
    ok,
    badRequest,
    forbidden,
    notFound,
    serverError,
    unauthorized,
    unprocessable
  };

  Object.assign(res, responseTypes);
  next();
}
