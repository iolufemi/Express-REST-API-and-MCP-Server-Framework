import db from '../database/index.js';
import mongoose, { Schema, Document } from 'mongoose';

const collection = 'APICalls';

interface APICallDocument extends Document {
  RequestId: string;
  uri: string;
  method: string;
  service: string;
  data?: any;
  headers?: any;
  response?: any;
  responseStatusCode?: number;
  createdAt?: Date;
  updatedAt?: Date;
  retriedAt?: Date;
}

const schemaObject: Record<string, any> = {
  RequestId: {
    type: String,
    unique: true
  },
  uri: {
    type: String,
    index: true
  },
  method: {
    type: String
  },
  service: {
    type: String
  },
  data: {
    type: Schema.Types.Mixed
  },
  headers: {
    type: Schema.Types.Mixed
  },
  response: {
    type: Schema.Types.Mixed
  },
  responseStatusCode: {
    type: Number,
    index: true
  }
};

schemaObject.createdAt = {
  type: Date,
  default: Date.now
};

schemaObject.updatedAt = {
  type: Date
};

schemaObject.retriedAt = {
  type: Date
};

// Let us define our schema
const SchemaDefinition = new mongoose.Schema(schemaObject);

const Model = db.mongo.model(collection, SchemaDefinition) as unknown as mongoose.Model<APICallDocument>;

export default Model;
