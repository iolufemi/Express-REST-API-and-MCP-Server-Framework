import axios, { AxiosRequestConfig } from 'axios';
import Model from './Model.js';
import log from '../logger/index.js';

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  uri: string;
  data?: any;
  headers?: Record<string, string>;
  insecure?: boolean;
  RequestId?: string;
  service?: string;
  retriedAt?: number;
  json?: boolean;
  qs?: any;
  body?: any;
}

export default async function request(
  service: string,
  requestId: string,
  uri: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  data: any,
  headers: Record<string, string> = {}
): Promise<any> {
  // Have you made this request before?
  // If yes, return the response from the previous request
  // Else make request
  // Log the response, the response code and updated at
  // End

  const options: RequestOptions = {
    method: method,
    uri: uri,
    data: data,
    headers: headers,
    insecure: true
  };

  let exists: any;

  try {
    const existing = await Model.findOne({ RequestId: requestId, service: service });
    exists = existing;

    if (!existing) {
      options.RequestId = requestId;
      options.service = service;
      await Model.create(options);
    } else if (existing.response && existing.responseStatusCode === 200) {
      return existing.response;
    } else {
      options.retriedAt = Date.now();
      await Model.findByIdAndUpdate(existing._id, options);
    }

    // Prepare axios request
    const axiosOptions: AxiosRequestConfig = {
      method: options.method,
      url: options.uri,
      headers: options.headers
    };

    if (options.method === 'GET') {
      axiosOptions.params = options.data;
    } else if (options.method === 'POST') {
      axiosOptions.data = options.data;
    } else {
      axiosOptions.params = options.data;
      axiosOptions.data = options.data;
    }

    const response = await axios(axiosOptions);

    // Update the request log
    await Model.updateOne(
      { RequestId: requestId, service: service },
      {
        response: response.data,
        responseStatusCode: response.status,
        updatedAt: Date.now()
      }
    );

    return response.data;
  } catch (err: any) {
    const errorResponse = err.response?.data || { type: 'internal error', message: err.message };
    const statusCode = err.response?.status || 500;

    if (exists) {
      await Model.updateOne(
        { RequestId: requestId, service: service },
        {
          response: errorResponse,
          responseStatusCode: statusCode,
          updatedAt: Date.now()
        }
      );
    } else {
      options.RequestId = requestId;
      options.service = service;
      (options as any).response = errorResponse;
      (options as any).responseStatusCode = statusCode;
      (options as any).updatedAt = Date.now();
      try {
        await Model.create(options);
      } catch (createErr: any) {
        log.error('Error while trying to update API request: ', createErr);
      }
    }

    throw errorResponse;
  }
}
