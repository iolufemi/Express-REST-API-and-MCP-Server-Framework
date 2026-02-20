import mongoose from 'mongoose';
import axios, { AxiosRequestConfig } from 'axios';
import config from '../../config/index.js';
import log from '../logger/index.js';
import debug from 'debug';
import _ from 'lodash';

const debugLog = debug('apiModel');

interface ApiModelQuery {
  limit?: number;
  select?: string;
  sort?: string;
  populate?: string;
  [key: string]: any;
}

interface ApiModelData {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  qs?: any;
  headers?: Record<string, string>;
}

interface Thenable<T> {
  then<R>(callback: (value: T) => R): Promise<R>;
}

class ApiModel implements Thenable<any> {
  private headers: Record<string, string> = {};
  private query: ApiModelQuery = {};
  private data: any = null;
  private id: string | null = null;
  private url: string;
  private baseurl: string;
  private endpoint: string;

  constructor(baseurl: string, endpoint: string, headers: Record<string, string> = {}) {
    log.info('API connection successful');
    this.headers = _.extend(this.headers, headers);
    this.baseurl = baseurl.replace(/\/$/, '');
    this.endpoint = endpoint.replace(/^\//, '');
    this.url = this.baseurl + '/' + this.endpoint;
  }

  /**
   * Set base URL at runtime (e.g. in tests to point at local server).
   */
  setBaseUrl(baseurl: string): void {
    this.baseurl = baseurl.replace(/\/$/, '');
    this.url = this.baseurl + '/' + this.endpoint;
  }

  private buildSelect(select: Record<string, number>): string {
    let string = '';
    const list: string[] = [];
    if (typeof select !== 'object') {
      throw { statusCode: 400, message: 'Projection should be an object. EG. {name: 1, place: 1}' };
    } else {
      for (const key in select) {
        if (typeof select[key] === 'number') {
          list.push(key);
        }
      }
      string = list.join(',');
    }
    return string;
  }

  private async call(data: ApiModelData): Promise<any> {
    debugLog('Sending HTTP ' + data.method + ' request to ' + data.url + ' with data => ' + JSON.stringify(data.data) + ' and headers => ' + JSON.stringify(this.headers) + ' all the data => ' + JSON.stringify(data));
    
    const tag = config.apiDBKey;
    this.headers['x-tag'] = tag;
    
    const options: AxiosRequestConfig = {
      method: data.method,
      url: data.url,
      headers: this.headers
    };

    if (data.method === 'GET') {
      debugLog(data);
      options.params = data.qs;
    } else if (data.method === 'POST') {
      options.data = data.data;
    } else {
      options.params = data.qs;
      options.data = data.data;
      debugLog('opt: ', options);
    }

    try {
      const response = await axios(options);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  }

  limit(limit: number): this {
    this.query.limit = limit;
    return this;
  }

  select(select: Record<string, number>): this {
    this.query.select = this.buildSelect(select);
    return this;
  }

  sort(sort: string): this {
    this.query.sort = sort;
    return this;
  }

  populate(populate: string): this {
    this.query.populate = populate;
    return this;
  }

  search(string: string): Thenable<any> {
    if (typeof string !== 'string') {
      throw { statusCode: 400, message: 'Please pass a string to search with' };
    }
    this.query = {};
    this.query = _.extend(this.query, {
      search: string
    });
    const data: ApiModelData = {
      url: this.url,
      method: 'GET',
      qs: this.query
    };

    const obj = this;
    return {
      then: async function (cb: (value: any) => any): Promise<any> {
        try {
          const resp = await obj.call(data);
          const result = cb(resp.data);
          return result;
        } catch (err: any) {
          throw { statusCode: 422, message: err };
        }
      }
    };
  }

  count(query: any): Thenable<any> {
    this.query = {};
    this.query = _.extend(this.query, query);
    const data: ApiModelData = {
      url: this.url,
      method: 'GET',
      qs: this.query
    };

    const obj = this;
    return {
      then: async function (cb: (value: any) => any): Promise<any> {
        try {
          const resp = await obj.call(data);
          const result = cb(resp.totalResult);
          return result;
        } catch (err: any) {
          throw { statusCode: 422, message: err };
        }
      }
    };
  }

  estimatedDocumentCount(query: any): Thenable<any> {
    return this.count(query);
  }

  find(query: any = {}): Thenable<any> {
    if (query.createdAt && query.createdAt.$gt) {
      query.from = query.createdAt.$gt;
      delete query.createdAt.$gt;
    }

    if (query.createdAt && query.createdAt.$lt) {
      query.to = query.createdAt.$lt;
      delete query.createdAt.$lt;
    }

    if (query.createdAt) {
      delete query.createdAt;
    }

    if (query._id && query._id.$gt) {
      query.lastId = query._id.$gt;
      delete query._id.$gt;
    }

    this.query = {};
    this.query = _.extend(this.query, query);
    const data: ApiModelData = {
      url: this.url,
      method: 'GET',
      qs: this.query
    };
    
    const obj = this;
    return {
      then: async function (cb: (value: any) => any): Promise<any> {
        try {
          const resp = await obj.call(data);
          const result = cb(resp.data);
          return result;
        } catch (err: any) {
          throw { statusCode: 422, message: err };
        }
      }
    };
  }

  findOne(query: any = {}): Thenable<any> {
    if (query.createdAt && query.createdAt.$gt) {
      query.from = query.createdAt.$gt;
      delete query.createdAt.$gt;
    }

    if (query.createdAt && query.createdAt.$lt) {
      query.to = query.createdAt.$lt;
      delete query.createdAt.$lt;
    }

    if (query._id && query._id.$gt) {
      query.lastId = query._id.$gt;
      delete query._id.$gt;
    }

    this.query = {};
    this.query = _.extend(this.query, query);
    const data: ApiModelData = {
      url: this.url,
      method: 'GET',
      qs: this.query
    };
    this.limit(1);
    this.sort('-_id');
    
    const obj = this;
    return {
      then: async function (cb: (value: any) => any): Promise<any> {
        try {
          const resp = await obj.call(data);
          const result = cb(resp.data[0]);
          return result;
        } catch (err: any) {
          throw { statusCode: 422, message: err };
        }
      }
    };
  }

  async findOneAndUpdate(query: any, data: any): Promise<any> {
    if (!query) {
      query = {};
    }
    this.query = {};
    this.query = _.extend(this.query, query);
    this.data = data;
    if (this.data && this.data._id && typeof this.data._id !== 'string') {
      this.data._id = this.data._id.toString();
    }
    const resp = await this.findOne(this.query).then((r: any) => r);
    debugLog('to update: ', resp);
    return this.findByIdAndUpdate(resp._id, this.data);
  }

  async findOneAndRemove(query: any): Promise<any> {
    if (!query) {
      query = {};
    }
    this.query = {};
    this.query = _.extend(this.query, query);
    const resp = await this.findOne(this.query).then((r: any) => r);
    debugLog('to remove: ', resp);
    return this.findByIdAndRemove(resp._id);
  }

  findById(id: string): Thenable<any> {
    if (!id) {
      throw { statusCode: 400, message: 'Stop! You need to pass an ID' };
    }

    if (typeof id !== 'string') {
      throw { statusCode: 400, message: 'Stop! ID needs to be a string' };
    }

    this.id = id;

    debugLog('the id id id: ', id);
    this.query = {};
    const data: ApiModelData = {
      url: this.url + '/' + this.id,
      method: 'GET',
      qs: this.query
    };
    
    const obj = this;
    return {
      then: async function (cb: (value: any) => any): Promise<any> {
        try {
          const resp = await obj.call(data);
          debugLog('what do we have here: ', resp);
          const result = cb(resp.data);
          return result;
        } catch (err: any) {
          throw err;
        }
      }
    };
  }

  create(data: any): Thenable<any> {
    if (!data) {
      throw { statusCode: 400, message: 'Stop! You need to pass data' };
    }

    if (typeof data !== 'object') {
      throw { statusCode: 400, message: 'Stop! Data must be an object' };
    }

    this.data = data;

    if (this.data && this.data._id && typeof this.data._id !== 'string') {
      this.data._id = this.data._id.toString();
    }

    debugLog('Data: ', this.data);

    const _data: ApiModelData = {
      url: this.url,
      method: 'POST',
      data: this.data
    };
    
    const obj = this;
    return {
      then: async function (cb: (value: any) => any): Promise<any> {
        try {
          const resp = await obj.call(_data);
          const result = cb(resp.data);
          return result;
        } catch (err: any) {
          throw err;
        }
      }
    };
  }

  updateMany(query: any, data: any): Thenable<any> {
    if (!data) {
      throw { statusCode: 400, message: 'Stop! You need to pass data' };
    }

    if (typeof data !== 'object') {
      throw { statusCode: 400, message: 'Stop! Data must be an object' };
    }

    data.updatedAt = new Date(Date.now()).toISOString();
    this.data = data;
    if (this.data && this.data._id && typeof this.data._id !== 'string') {
      this.data._id = this.data._id.toString();
    }
    this.query = {};
    this.query = _.extend(this.query, query);

    const _data: ApiModelData = {
      url: this.url,
      method: 'PUT',
      data: this.data,
      qs: this.query
    };
    
    const obj = this;
    return {
      then: async function (cb: (value: any) => any): Promise<any> {
        try {
          const resp = await obj.call(_data);
          const result = cb(resp.data);
          return result;
        } catch (err: any) {
          throw err;
        }
      }
    };
  }

  update(query: any, data: any): Thenable<any> {
    return this.updateMany(query, data);
  }

  findByIdAndUpdate(id: string, data: any): Thenable<any> {
    if (!data) {
      throw { statusCode: 400, message: 'Stop! You need to pass data' };
    }

    if (typeof data !== 'object') {
      throw { statusCode: 400, message: 'Stop! Data must be an object' };
    }

    if (!id) {
      throw { statusCode: 400, message: 'Stop! You need to pass an ID' };
    }

    if (typeof id !== 'string') {
      throw { statusCode: 400, message: 'Stop! ID needs to be a string' };
    }

    data.updatedAt = new Date(Date.now()).toISOString();
    this.data = data;

    if (this.data && this.data._id && typeof this.data._id !== 'string') {
      this.data._id = this.data._id.toString();
    }
    this.id = id;

    debugLog('this is what we are sending: ', this.data);
    const _data: ApiModelData = {
      url: this.url + '/' + this.id,
      method: 'PATCH',
      data: this.data
    };
    
    const obj = this;
    return {
      then: async function (cb: (value: any) => any): Promise<any> {
        try {
          const resp = await obj.call(_data);
          const result = cb(resp.data);
          return result;
        } catch (err: any) {
          throw err;
        }
      }
    };
  }

  deleteMany(query: any): Thenable<any> {
    this.query = {};
    this.query = _.extend(this.query, query);

    const _data: ApiModelData = {
      url: this.url,
      method: 'DELETE',
      qs: this.query
    };
    
    const obj = this;
    return {
      then: async function (cb: (value: any) => any): Promise<any> {
        try {
          const resp = await obj.call(_data);
          const result = cb(resp.data);
          return result;
        } catch (err: any) {
          throw err;
        }
      }
    };
  }

  findByIdAndRemove(id: string): Thenable<any> {
    if (!id) {
      throw { statusCode: 400, message: 'Stop! You need to pass an ID' };
    }

    if (typeof id !== 'string') {
      throw { statusCode: 400, message: 'Stop! ID needs to be a string' };
    }

    this.id = id;

    const _data: ApiModelData = {
      url: this.url + '/' + this.id,
      method: 'DELETE'
    };
    
    const obj = this;
    return {
      then: async function (cb: (value: any) => any): Promise<any> {
        try {
          const resp = await obj.call(_data);
          const result = cb(resp.data);
          debugLog('Was deleted: ', resp);
          return result;
        } catch (err: any) {
          throw err;
        }
      }
    };
  }

  async deleteOne(query: any): Promise<any> {
    if (!query) {
      query = {};
    }
    this.query = {};
    this.query = _.extend(this.query, query);
    const resp = await this.findOne(this.query).then((r: any) => r);
    debugLog('to delete: ', resp);
    return this.findByIdAndRemove(resp._id);
  }

  then<R>(callback: (value: any) => R): Promise<R> {
    return Promise.resolve().then(() => callback(null));
  }
}

export default ApiModel;
export const _mongoose = mongoose;
