import db from '../services/database/index.js';
import mongoose, { Schema, Document, Model as MongooseModel } from 'mongoose';
import { SchemaFieldDefinition } from '../types/models.js';
import debug from 'debug';

const collection = 'Trash';
const service = 'Users';
const debugLog = debug(collection);

// Queue will be imported after Bull migration
// import queue from '../services/queue/index.js';

const schemaObject: Record<string, SchemaFieldDefinition | unknown> = {
  data: {
    type: Schema.Types.Mixed,
    description: 'Deleted data',
    mcpDescription: 'The complete data object that was deleted, stored for potential restoration'
  },
  service: {
    type: String,
    default: service,
    description: 'Service name',
    mcpDescription: 'Name of the service/model from which this data was deleted'
  }
};

schemaObject.createdAt = {
  type: Date,
  default: Date.now,
  index: true,
  description: 'Deletion timestamp',
  mcpDescription: 'Date and time when the data was deleted and moved to trash'
};

schemaObject.updatedAt = {
  type: Date,
  description: 'Update timestamp',
  mcpDescription: 'Date and time when the trash entry was last updated'
};

schemaObject.owner = {
  type: Schema.Types.ObjectId,
  ref: 'Accounts',
  description: 'Owner account ID',
  mcpDescription: 'Reference to the account that owned the deleted data'
};

schemaObject.deletedBy = {
  type: Schema.Types.ObjectId,
  ref: 'Accounts',
  description: 'Deleter account ID',
  mcpDescription: 'Reference to the account that performed the deletion'
};

schemaObject.client = {
  type: Schema.Types.ObjectId,
  ref: 'Clients',
  description: 'Client ID',
  mcpDescription: 'Reference to the client application that initiated the deletion'
};

schemaObject.developer = {
  type: Schema.Types.ObjectId,
  ref: 'Users',
  description: 'Developer user ID',
  mcpDescription: 'Reference to the developer user associated with this deletion'
};

schemaObject.tags = {
  type: [String],
  index: 'text',
  description: 'Search tags',
  mcpDescription: 'Array of searchable tags extracted from deleted data for full-text search'
};

// Let us define our schema
const SchemaDefinition = new mongoose.Schema(schemaObject);

// Index all text for full text search
SchemaDefinition.statics.search = function(string: string) {
  return this.find({ $text: { $search: string } }, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } });
};

// Adding hooks
SchemaDefinition.pre('save', function(this: mongoose.Document & { _doc?: Record<string, unknown> }, next: () => void) {
  // Indexing for search
  const ourDoc = this._doc ?? {};
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

SchemaDefinition.pre('find', function(this: mongoose.Query<unknown, unknown> & { start?: number }, next: () => void) {
  debugLog(this instanceof mongoose.Query); // true
  this.start = Date.now();
  next();
});

SchemaDefinition.post('find', function(this: mongoose.Query<unknown, unknown> & { start?: number }, result: unknown) {
  debugLog(this instanceof mongoose.Query); // true
  // prints returned documents
  debugLog('find() returned ' + JSON.stringify(result));
  // prints number of milliseconds the query took
  debugLog('find() took ' + ((Date.now() - (this.start || 0)) + ' millis'));
});

SchemaDefinition.pre(['updateOne', 'updateMany'], function(this: mongoose.Query<unknown, unknown> & { _update?: Record<string, unknown> }, next: () => void) {
  // Indexing for search
  const ourDoc = this._update ?? {};
  ourDoc.model = collection;
  ourDoc.update = true;

  if (ourDoc.updatedAt || ourDoc.tags) {
    // Move along! Nothing to see here!!
  } else {
    // Queue job will be handled by Bull later
    // queue.create('searchIndex', ourDoc).save();
  }
  ourDoc.updatedAt = new Date(Date.now()).toISOString();
  next();
});

interface TrashDocument extends Document {
  data: unknown;
  service: string;
  createdAt?: Date;
  updatedAt?: Date;
  owner?: Schema.Types.ObjectId;
  deletedBy?: Schema.Types.ObjectId;
  client?: Schema.Types.ObjectId;
  developer?: Schema.Types.ObjectId;
  tags?: string[];
}

interface TrashModel extends MongooseModel<TrashDocument> {
  search(string: string): mongoose.Query<TrashDocument[], TrashDocument>;
}

const Model = db.logMongo.model<TrashDocument, TrashModel>(collection, SchemaDefinition);
(Model as unknown as MongooseModel<TrashDocument> & { _mongoose: typeof mongoose })._mongoose = mongoose;

export default Model;
