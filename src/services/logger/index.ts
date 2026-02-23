import winston from 'winston';
import config from '../../config/index.js';
import { ExpressRequest, ExpressResponse, ExpressNext } from '../../types/express.js';
import winstonLoggly from 'winston-loggly-bulk';

const log = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'api-template' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

if (config.env === 'production') {
  if (!config.bugsnagKey && !config.logglyToken) {
    log.add(new winston.transports.File({
      filename: `app-${new Date().toDateString().split(' ').join('_')}.log`,
      level: 'warn'
    }));
    log.remove(winston.transports.Console);
  } else {
    // Note: Bugsnag support removed - the old 'bugsnag' package is deprecated
    // To re-enable, install @bugsnag/js and @bugsnag/node, then update this code
    if (config.bugsnagKey) {
      log.warn('Bugsnag key provided but Bugsnag package not installed. Install @bugsnag/js to enable error tracking.');
    }
    if (config.logglyToken) {
      log.add(new winstonLoggly({
        token: config.logglyToken,
        subdomain: config.logglySubdomain || '',
        tags: [config.logglyTag || ''],
        json: true,
        level: 'warn'
      }) as any);
    }
    log.add(new winston.transports.File({
      filename: `app-${new Date().toDateString().split(' ').join('_')}.log`,
      level: 'warn'
    }));
    log.remove(winston.transports.Console);
  }
}

export default log;

export function errorHandler(err: any, _req: ExpressRequest, res: ExpressResponse, _next: ExpressNext): void {
  log.error(err);
  
  if (err.statusCode === 404) {
    res.notFound?.(err);
  } else if (err.statusCode === 401) {
    res.unauthorized?.(err);
  } else if (err.statusCode === 400) {
    res.badRequest?.(err);
  } else if (err.statusCode === 403) {
    res.forbidden?.(err);
  } else if (err.statusCode === 422) {
    res.unprocessable?.(err);
  } else {
    res.serverError?.(err);
  }
}
