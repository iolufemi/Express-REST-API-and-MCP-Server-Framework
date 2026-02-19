import _ from 'lodash';
import path from 'path';
import fs from 'fs';
import { ModelRegistry } from '../types/models.js';

const models: ModelRegistry = {};
const normalizedPath = path.join(__dirname, './');

const files = fs.readdirSync(normalizedPath);
const filesCount = files.length;
let count = 0;

const associate = function(models: ModelRegistry): void {
  _.forOwn(models, (value: any, _key: string) => {
    if ((value as any).associate) {
      (value as any).associate(models);
    }
  });
};

files.forEach((file) => {
  count = count + 1;
  const splitFileName = file.split('.');
  if (splitFileName[0] !== 'index') {
    const modelName = splitFileName[0];
    // Import the model dynamically
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const modelModule = require('./' + modelName);
    models[modelName] = modelModule.default || modelModule;
  }
  if (count === filesCount) {
    associate(models);
  }
});

export default models;
