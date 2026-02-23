import modelsPromise from '../../models/index.js';
import queue from './index.js';
import _ from 'lodash';
import log from '../logger/index.js';
import axios from 'axios';
import request from '../request/index.js';
import { RequestLogJobData, ResponseLogJobData, SearchIndexJobData, TrashJobData, WebhookJobData, HTTPRequestJobData } from '../../types/queue.js';

const jobs = {
  // Logs all API requests
  createRequestLog: async (data: RequestLogJobData): Promise<unknown> => {
    log.info('logging API request: ', data.RequestId);
    const models = await modelsPromise;
    try {
      const res = await (models.RequestLogs as { create: (d: RequestLogJobData) => Promise<unknown> }).create(data);
      return res;
    } catch (err: any) {
      log.error(err);
      throw { statusCode: 422, message: err };
    }
  },

  // Logs all API responses
  updateRequestLog: async (data: ResponseLogJobData): Promise<unknown> => {
    log.info('logging API response: ', data.requestId);
    const models = await modelsPromise;
    const requestId = data.requestId;
    const updateData = { ...data };
    if ('requestId' in updateData) {
      delete (updateData as Record<string, unknown>).requestId;
    }

    try {
      const res = await (models.RequestLogs as { updateOne: (q: object, u: object) => Promise<unknown> }).updateOne({ RequestId: requestId }, updateData);
      return res;
    } catch (err: any) {
      log.error(err);
      throw { statusCode: 422, message: err };
    }
  },

  // Creates search tags for all db records
  createSearchTags: async (data: SearchIndexJobData): Promise<unknown> => {
    log.info('Creating search index for: ', data._id);
    const models = await modelsPromise;
    const dataClone = _.extend({}, data);
    const model = data.model;
    const isSQL = data.isSQL;

    const update = data.update ? true : false;
    if (dataClone && (dataClone).update) {
      delete (dataClone).update;
    }
    if (dataClone && (dataClone).model) {
      delete (dataClone).model;
    }
    if (dataClone && (dataClone).isSQL) {
      delete (dataClone).isSQL;
    }
    if (dataClone && (dataClone).createdAt) {
      delete (dataClone).createdAt;
    }
    if (dataClone && (dataClone).updatedAt) {
      delete (dataClone).updatedAt;
    }

    const ourDoc = dataClone;
    const split: string[] = [];

    for (const n in ourDoc) {
      if (ourDoc[n] === (ourDoc)._id) {
        // Skip
      } else if (ourDoc[n] === (ourDoc).createdAt) {
        // Skip
      } else if (ourDoc[n] === (ourDoc).updatedAt) {
        // Skip
      } else if (ourDoc[n] === (ourDoc).tags) {
        // Skip
      } else {
        if (typeof ourDoc[n] === 'string') {
          split.push(...ourDoc[n].split(' '));
        }
      }
    }
    const flattenedSplit = _.flattenDeep(split);

    let task: Promise<any>;
    if (model && models[model]) {
      if (isSQL) {
        task = (models[model] as any).update(
          { tags: flattenedSplit.join(', ') },
          { where: { _id: dataClone._id } }
        );
      } else {
        if (update) {
          task = (models[model] as any).updateOne(dataClone, { updatedAt: new Date(Date.now()).toISOString(), tags: flattenedSplit.join(' ') });
        } else {
          task = (models[model] as any).updateOne(dataClone, { tags: flattenedSplit.join(' ') });
        }
      }

      try {
        const res = await task;
        return res;
      } catch (err: any) {
        log.error(err);
        throw { statusCode: 422, message: err };
      }
    } else {
      throw { statusCode: 400, message: 'No Model Passed!' };
    }
  },

  // Backup Data to Trash
  saveToTrash: async (data: TrashJobData): Promise<unknown> => {
    if (data.data) {
      const models = await modelsPromise;
      log.info('Saving ' + (data.data as { _id?: string })?._id + ' to Trash...');
      try {
        const res = await (models.Trash as { create: (d: TrashJobData) => Promise<unknown> }).create(data);
        return res;
      } catch (err: any) {
        throw { statusCode: 422, message: err };
      }
    } else {
      throw { statusCode: 400, message: 'No data was passed' };
    }
  },

  // Send Webhook Event
  sendWebhook: async (data: WebhookJobData): Promise<any> => {
    log.info('Sending Webhook...');
    try {
      const resp = await request('webhook', data.reference, data.webhookURL, 'POST', data.data, {
        'content-type': 'application/json'
      });
      return resp;
    } catch (err: unknown) {
      // Retry in 5 minutes
      const fiveMinutesMs = 5 * 60 * 1000;
      await queue.create('sendWebhook', data, { delay: fiveMinutesMs })
        .save();
      throw err;
    }
  },

  // Send HTTP Request
  sendHTTPRequest: async (data: HTTPRequestJobData): Promise<any> => {
    log.info('Sending HTTP ' + data.method + ' request to ' + data.url + ' with data => ' + JSON.stringify(data.data) + ' and headers => ' + JSON.stringify(data.headers));

    const options: any = {
      method: data.method,
      url: data.url,
      headers: data.headers || {}
    };

    if (data.method === 'GET') {
      options.params = data.data;
    } else if (data.method === 'POST') {
      options.data = data.data;
    } else {
      options.params = data.data;
      options.data = data.data;
    }

    try {
      const resp = await axios(options);
      return resp.data;
    } catch (err: any) {
      throw { statusCode: 422, message: err.message };
    }
  }
};

export default jobs;
