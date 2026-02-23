import db from '../database/logMongo.js';
import mongoose, { Schema, Document } from 'mongoose';
import { SchemaFieldDefinition } from '../../types/models.js';

const collection = 'Clock';

interface ClockDocument extends Document {
  job: string;
  crontab: string;
  name: string;
  enabled: boolean;
  arguments?: any;
  lastRunAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const schemaObject: Record<string, SchemaFieldDefinition | any> = {
  job: {
    type: String,
    description: 'Job name',
    mcpDescription: 'Name of the job function to execute when the schedule triggers'
  },
  crontab: {
    type: String,
    description: 'Cron expression',
    mcpDescription: 'Cron expression defining when the job should run (e.g., "* * * * *" for every minute)'
  },
  name: {
    type: String,
    unique: true,
    description: 'Schedule name',
    mcpDescription: 'Unique name for this scheduled job configuration'
  },
  enabled: {
    type: Boolean,
    default: true,
    description: 'Enabled flag',
    mcpDescription: 'Whether this scheduled job is currently enabled and should run'
  },
  arguments: {
    type: Schema.Types.Mixed,
    description: 'Job arguments',
    mcpDescription: 'Arguments to pass to the job function when it executes'
  },
  lastRunAt: {
    type: Date,
    description: 'Last run timestamp',
    mcpDescription: 'Date and time when this scheduled job last executed'
  }
};

schemaObject.createdAt = {
  type: Date,
  default: Date.now,
  description: 'Creation timestamp',
  mcpDescription: 'Date and time when this schedule was created'
};

schemaObject.updatedAt = {
  type: Date,
  description: 'Update timestamp',
  mcpDescription: 'Date and time when this schedule was last updated'
};

// Let us define our schema
const SchemaDefinition = new mongoose.Schema(schemaObject);

const ClockModel = db.model<ClockDocument>(collection, SchemaDefinition);

export default ClockModel;
