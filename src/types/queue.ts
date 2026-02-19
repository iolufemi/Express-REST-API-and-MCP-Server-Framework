/**
 * Queue type definitions
 */

import { Job, Queue, QueueOptions } from 'bull';

/**
 * Queue job data types
 */
export interface QueueJobData {
  [key: string]: any;
}

/**
 * Job types enum
 */
export enum JobType {
  SEARCH_INDEX = 'searchIndex',
  LOG_REQUEST = 'logRequest',
  LOG_RESPONSE = 'logResponse',
  SAVE_TO_TRASH = 'saveToTrash',
  SEND_WEBHOOK = 'sendWebhook',
  SEND_HTTP_REQUEST = 'sendHTTPRequest'
}

/**
 * Search index job data
 */
export interface SearchIndexJobData extends QueueJobData {
  _id: string;
  model: string;
  isSQL?: boolean;
  update?: boolean;
  [key: string]: any;
}

/**
 * Request log job data
 */
export interface RequestLogJobData extends QueueJobData {
  RequestId: string;
  ipAddress: string;
  url: string;
  method: string;
  body: any;
  app?: string;
  user?: string;
  device?: string;
  createdAt: Date;
}

/**
 * Response log job data
 */
export interface ResponseLogJobData extends QueueJobData {
  requestId: string;
  response?: any;
  statusCode?: number;
  [key: string]: any;
}

/**
 * Trash job data
 */
export interface TrashJobData extends QueueJobData {
  service: string;
  data: any;
  owner?: string;
  deletedBy?: string;
  client?: string;
  developer?: string;
}

/**
 * Webhook job data
 */
export interface WebhookJobData extends QueueJobData {
  reference: string;
  webhookURL: string;
  data: any;
}

/**
 * HTTP request job data
 */
export interface HTTPRequestJobData extends QueueJobData {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  data?: any;
}

/**
 * Clock job configuration
 */
export interface ClockJobConfig {
  crontab: string;
  name: string;
  job: string;
  enabled: boolean;
  arguments?: any;
  lastRunAt?: Date;
}

/**
 * Queue configuration
 */
export interface QueueConfig extends Partial<QueueOptions> {
  redis: string | object;
  defaultJobOptions?: {
    attempts?: number;
    backoff?: {
      type: string;
      delay: number;
    };
    removeOnComplete?: boolean | number | { age?: number; count?: number };
    removeOnFail?: boolean | number | { age?: number };
  };
}

/**
 * Bull queue type
 */
export type BullQueue = Queue<QueueJobData>;

/**
 * Bull job type
 */
export type BullJob = Job<QueueJobData>;
