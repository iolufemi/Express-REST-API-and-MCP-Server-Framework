import aesjsModule from 'aes-js';
import * as crypto from 'crypto';

// ESM interop: CJS module may export as default
const aesjs = (aesjsModule as unknown as { default?: typeof aesjsModule }).default ?? aesjsModule;
import config from '../../config/index.js';
import randomstring from 'randomstring';
import debug from 'debug';
import type { ExpressRequest, ExpressResponse, ExpressNext } from '../../types/express.js';

const debugLog = debug('encryption');

export interface EncryptionResult {
  truth: string;
  encryptedText: string;
}

export const encryption = {
  generateKey: function (): Promise<string> {
    return new Promise((resolve, reject) => {
      const salt = randomstring.generate(256);
      debugLog('salt: ', salt);

      const bits = 256;

      crypto.pbkdf2(config.secret, salt, 100000, bits / 8, 'sha512', (err: Error | null, key: Buffer | undefined) => {
        if (err) {
          reject(err);
        } else if (!key) {
          reject(new Error('pbkdf2 did not produce a key'));
        } else {
          const randomNumber = Math.floor((Math.random() * 9999) + 1);
          resolve(Buffer.from(aesjs.utils.hex.fromBytes(key) + '//////' + randomNumber).toString('base64'));
        }
      });
    });
  },

  encrypt: function (text: string, key: string): Promise<EncryptionResult> {
    debugLog('started encryption');
    debugLog('using key: ', key);
    key = Buffer.from(key, 'base64').toString('utf-8');
    debugLog('What i see here: ', key);
    const splitKey = key.split('//////');
    const keyPart = splitKey[0];
    const counter = ((parseInt(splitKey[1] || '0', 10) * 1) * 10) / 5;
    debugLog('our counter: ', counter);
    debugLog('our key: ', keyPart);
    const keyBytes = aesjs.utils.hex.toBytes(keyPart);
    debugLog('in buffer: ', keyBytes);
    const truth = crypto.createHash('sha512')
      .update(text)
      .digest('hex');
    
    return new Promise((resolve) => {
      debugLog('encrypting...');
      debugLog('our key: ', keyBytes);

      // Convert text to bytes
      debugLog('our text: ', text);
      const textBytes = aesjs.utils.utf8.toBytes(text);
      debugLog('textBytes: ', textBytes);
      const aesCtr = new aesjs.ModeOfOperation.ctr(keyBytes, new aesjs.Counter(counter));
      const encryptedBytes = aesCtr.encrypt(textBytes);

      // Convert our bytes back into text
      const encryptedText = aesjs.utils.hex.fromBytes(encryptedBytes);
      debugLog('finished encryption');
      resolve({
        truth: truth,
        encryptedText: encryptedText
      });
    });
  },

  decrypt: function (text: string, key: string, truthHash: string): Promise<string> {
    debugLog('text: ', text);
    key = Buffer.from(key, 'base64').toString('utf-8');
    debugLog('What i see here: ', key);
    const splitKey = key.split('//////');
    const keyPart = splitKey[0];
    const counter = ((parseInt(splitKey[1] || '0', 10) * 1) * 10) / 5;
    debugLog('our counter: ', counter);
    debugLog('our key: ', keyPart);
    const keyBytes = aesjs.utils.hex.toBytes(keyPart);

    return new Promise((resolve, reject) => {
      debugLog('our key2: ', keyBytes);
      // Convert text to bytes
      const textBytes = aesjs.utils.hex.toBytes(text);

      // The cipher-block chaining mode of operation maintains internal
      // state, so to decrypt a new instance must be instantiated.
      const aesCtr = new aesjs.ModeOfOperation.ctr(keyBytes, new aesjs.Counter(counter));
      const decryptedBytes = aesCtr.decrypt(textBytes);

      // Convert our bytes back into text
      const decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);

      debugLog('checking if data was not hijacked...');

      const truthConfirmationHash = crypto.createHash('sha512')
        .update(decryptedText)
        .digest('hex');
      debugLog('sent hash: ', truthHash);
      debugLog('generated hash: ', truthConfirmationHash);

      if (truthHash === truthConfirmationHash) {
        resolve(decryptedText);
      } else {
        reject({ statusCode: 400, message: 'Data integrity compromised!' });
      }
    });
  },

  /**
   * Interpreter middleware: enforces x-tag for POST requests and optionally decrypts secure payloads.
   * All POST requests must include an x-tag header (or query param). Get a value from GET /initialize.
   * Without x-tag, POST receives 400 with message directing the client to use GET /initialize.
   * MCP endpoints (/mcp/*) are excluded so Cursor and other MCP clients can POST without x-tag.
   */
  interpreter: function (req: ExpressRequest, res: ExpressResponse, next: ExpressNext): void {
    const path = (req.baseUrl || '') + (req.path || '');
    if (path.startsWith('/mcp')) {
      next();
      return;
    }
    if (req.get('x-tag') || req.query?.['x-tag']) {
      const key = req.get('x-tag') || req.query?.['x-tag'] as string;
      res.set('x-tag', key);
      res.set('Access-Control-Expose-Headers', 'x-tag');
      if (req.query && req.query['x-tag']) {
        delete req.query['x-tag'];
      }

      if (req.method === 'POST' && config.secureMode && req.body?.secure === true) {
        if (req.body.secureData) {
          const truthHash = req.body.truth;
          encryption.decrypt(req.body.secureData, key, truthHash)
            .then((resp: string) => {
              try {
                if (typeof resp === 'object') {
                  req.body = resp;
                  next();
                } else {
                  debugLog('decryptedText: ', resp);
                  const parsedJSON = JSON.parse(resp);
                  req.body = parsedJSON;
                  req.body.secure = true;
                  next();
                }
              } catch (err) {
                req.body = { secure: true, data: resp };
                next();
              }
            })
            .catch((err: any) => {
              next(err);
            });
        } else {
          res.badRequest?.(
          false,
          'Secure POST requires body.secureData (and body.truth). Send encrypted payload when using secure mode.'
        );
        }
      } else {
        next();
      }
    } else if (req.method !== 'POST') {
      next();
    } else {
      res.badRequest?.(
        undefined,
        'POST requests require an x-tag header. Get a value from GET /initialize and send it as the x-tag header (or query param x-tag).'
      );
    }
  }
};

export default encryption;
