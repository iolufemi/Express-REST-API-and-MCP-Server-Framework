import models from '../../models/index.js';
import _ from 'lodash';
import log from '../logger/index.js';
import axios from 'axios';
import request from '../request/index.js';
import { RequestLogJobData, ResponseLogJobData, SearchIndexJobData, TrashJobData, WebhookJobData, HTTPRequestJobData } from '../../types/queue.js';

const jobs = {
  // Logs all API requests
  createRequestLog: async (data: RequestLogJobData): Promise<any> => {
    log.info('logging API request: ', data.RequestId);
    try {
      const res = await (models.RequestLogs as any).create(data);
      return res;
    } catch (err: any) {
      log.error(err);
      throw { statusCode: 422, message: err };
    }
  },

  // Logs all API responses
  updateRequestLog: async (data: ResponseLogJobData): Promise<any> => {
    log.info('logging API response: ', data.requestId);
    const requestId = data.requestId;
    const updateData = { ...data };
    if ('requestId' in updateData) {
      delete (updateData as any).requestId;
    }

    try {
      const res = await (models.RequestLogs as any).updateOne({ RequestId: requestId }, updateData);
      return res;
    } catch (err: any) {
      log.error(err);
      throw { statusCode: 422, message: err };
    }
  },

  // Creates search tags for all db records
  createSearchTags: async (data: SearchIndexJobData): Promise<any> => {
    log.info('Creating search index for: ', data._id);
    const dataClone = _.extend({}, data);
    const model = data.model;
    const isSQL = data.isSQL;

    const update = data.update ? true : false;
    if (dataClone && (dataClone as any).update) {
      delete (dataClone as any).update;
    }
    if (dataClone && (dataClone as any).model) {
      delete (dataClone as any).model;
    }
    if (dataClone && (dataClone as any).isSQL) {
      delete (dataClone as any).isSQL;
    }
    if (dataClone && (dataClone as any).createdAt) {
      delete (dataClone as any).createdAt;
    }
    if (dataClone && (dataClone as any).updatedAt) {
      delete (dataClone as any).updatedAt;
    }

    const ourDoc = dataClone;
    const split: string[] = [];

    for (const n in ourDoc) {
      if (ourDoc[n] === (ourDoc as any)._id) {
        // Skip
      } else if (ourDoc[n] === (ourDoc as any).createdAt) {
        // Skip
      } else if (ourDoc[n] === (ourDoc as any).updatedAt) {
        // Skip
      } else if (ourDoc[n] === (ourDoc as any).tags) {
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
        task = (models[model] as any).update({ tags: flattenedSplit.join(', ') }, { where: dataClone });
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
  saveToTrash: async (data: TrashJobData): Promise<any> => {
    if (data.data) {
      log.info('Saving ' + data.data._id + ' to Trash...');
      try {
        const res = await (models.Trash as any).create(data);
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
    } catch (err: any) {
      // Retry in 5 minutes time
      const queue = require('./');
      await queue.create('sendWebhook', data)
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
