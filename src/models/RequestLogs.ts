import db from '../services/database/index.js';
import mongoose, { Schema, Document, Model as MongooseModel } from 'mongoose';
import { SchemaFieldDefinition } from '../types/models.js';
import debug from 'debug';

const collection = 'RequestLogs';
const service = 'Users';
const debugLog = debug(collection);

// Queue will be imported after Bull migration
// import queue from '../services/queue/index.js';

const schemaObject: Record<string, SchemaFieldDefinition | any> = {
  RequestId: {
    type: String,
    unique: true,
    description: 'Unique request identifier',
    mcpDescription: 'Unique identifier for the API request, used for tracking and logging purposes'
  },
  ipAddress: {
    type: String,
    description: 'Client IP address',
    mcpDescription: 'IP address of the client making the request, used for rate limiting and security'
  },
  url: {
    type: String,
    index: true,
    description: 'Request URL',
    mcpDescription: 'Full URL of the API request including query parameters (passwords are sanitized)'
  },
  method: {
    type: String,
    index: true,
    description: 'HTTP method',
    mcpDescription: 'HTTP method used for the request (GET, POST, PUT, PATCH, DELETE)'
  },
  service: {
    type: String,
    default: service,
    description: 'Service name',
    mcpDescription: 'Name of the service/endpoint that handled the request'
  },
  body: {
    type: Schema.Types.Mixed,
    description: 'Request body',
    mcpDescription: 'Request body data (sensitive fields like passwords are removed for security)'
  },
  app: {
    type: Schema.Types.ObjectId,
    ref: 'Applications',
    description: 'Application ID',
    mcpDescription: 'Reference to the application making the request'
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'Users',
    index: true,
    description: 'User ID',
    mcpDescription: 'Reference to the user account making the request (if authenticated)'
  },
  device: {
    type: String,
    description: 'Device information',
    mcpDescription: 'User agent string identifying the client device and browser'
  },
  response: {
    type: Schema.Types.Mixed,
    description: 'Response data',
    mcpDescription: 'API response data returned to the client'
  }
};

schemaObject.createdAt = {
  type: Date,
  default: Date.now,
  index: true,
  description: 'Creation timestamp',
  mcpDescription: 'Date and time when the request was received and logged'
};

schemaObject.updatedAt = {
  type: Date,
  description: 'Update timestamp',
  mcpDescription: 'Date and time when the request log was last updated (typically when response is logged)'
};

schemaObject.owner = {
  type: Schema.Types.ObjectId,
  ref: 'Accounts',
  description: 'Owner account ID',
  mcpDescription: 'Reference to the account that owns this request log'
};

schemaObject.createdBy = {
  type: Schema.Types.ObjectId,
  ref: 'Accounts',
  description: 'Creator account ID',
  mcpDescription: 'Reference to the account that created this log entry'
};

schemaObject.client = {
  type: Schema.Types.ObjectId,
  ref: 'Clients',
  description: 'Client ID',
  mcpDescription: 'Reference to the client application making the request'
};

schemaObject.developer = {
  type: Schema.Types.ObjectId,
  ref: 'Users',
  description: 'Developer user ID',
  mcpDescription: 'Reference to the developer user associated with this request'
};

schemaObject.tags = {
  type: [String],
  index: 'text',
  description: 'Search tags',
  mcpDescription: 'Array of searchable tags extracted from request data for full-text search'
};

// Let us define our schema
const SchemaDefinition = new mongoose.Schema(schemaObject);

// Index all text for full text search
SchemaDefinition.statics.search = function(string: string) {
  return this.find({ $text: { $search: string } }, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } });
};

// Adding hooks
SchemaDefinition.pre('save', function(this: mongoose.Document, next: () => void) {
  // Indexing for search
  const ourDoc = (this as any)._doc;
  ourDoc.model = collection;

  // Queue job will be handled by Bull later
  // queue.create('searchIndex', ourDoc).save();

  next();
});

SchemaDefinition.post('init', function(doc: Document) {
  debugLog('%s has been initialized from the db', doc._id);
});

SchemaDefinition.post('validate', function(doc: Document) {
  debugLog('%s has been validated (but not saved yet)', doc._id);
});

SchemaDefinition.post('save', function(doc: Document) {
  debugLog('%s has been saved', doc._id);
});

SchemaDefinition.post('deleteOne', function(doc: Document) {
  debugLog('%s has been removed', doc._id);
});

SchemaDefinition.pre('validate', function(next: () => void) {
  debugLog('this gets printed first');
  next();
});

SchemaDefinition.post('validate', function() {
  debugLog('this gets printed second');
});

SchemaDefinition.pre('find', function(this: mongoose.Query<any, any>, next: () => void) {
  debugLog(this instanceof mongoose.Query); // true
  (this as any).start = Date.now();
  next();
});

SchemaDefinition.post('find', function(this: mongoose.Query<any, any> & { start?: number }, result: any) {
  debugLog(this instanceof mongoose.Query); // true
  // prints returned documents
  debugLog('find() returned ' + JSON.stringify(result));
  // prints number of milliseconds the query took
  debugLog('find() took ' + ((Date.now() - (this.start || 0)) + ' millis'));
});

SchemaDefinition.pre(['updateOne', 'updateMany'], function(this: mongoose.Query<any, any>, next: () => void) {
  // Indexing for search
  const ourDoc = (this as any)._update;
  ourDoc.updatedAt = new Date(Date.now()).toISOString();
  next();
});

interface RequestLogDocument extends Document {
  RequestId: string;
  ipAddress: string;
  url: string;
  method: string;
  service: string;
  body?: any;
  app?: Schema.Types.ObjectId;
  user?: Schema.Types.ObjectId;
  device?: string;
  response?: any;
  createdAt?: Date;
  updatedAt?: Date;
  owner?: Schema.Types.ObjectId;
  createdBy?: Schema.Types.ObjectId;
  client?: Schema.Types.ObjectId;
  developer?: Schema.Types.ObjectId;
  tags?: string[];
}

interface RequestLogModel extends MongooseModel<RequestLogDocument> {
  search(string: string): any;
}

const Model = db.logMongo.model<RequestLogDocument, RequestLogModel>(collection, SchemaDefinition) as RequestLogModel;
(Model as any)._mongoose = mongoose;

export default Model;
