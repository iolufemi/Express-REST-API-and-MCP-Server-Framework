import _ from 'lodash';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';
import { ModelRegistry } from '../types/models.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const associate = function (modelMap: ModelRegistry): void {
  _.forOwn(modelMap, (value: ModelRegistry[string], _key: string) => {
    if (value && typeof (value as ModelRegistry[string] & { associate?: (m: ModelRegistry) => void }).associate === 'function') {
      (value as ModelRegistry[string] & { associate: (m: ModelRegistry) => void }).associate(modelMap);
    }
  });
};

async function loadModels(): Promise<ModelRegistry> {
  const models: ModelRegistry = {};
  const files = fs.readdirSync(__dirname);
  const loadPromises: Promise<void>[] = [];

  for (const file of files) {
    const splitFileName = file.split('.');
    if (splitFileName[0] === 'index') continue;
    const modelName = splitFileName[0];
    const ext = splitFileName[1] || 'js';
    loadPromises.push(
      import(pathToFileURL(path.join(__dirname, modelName + '.' + ext)).href)
        .then((modelModule: { default?: unknown }) => {
          models[modelName] = (modelModule.default ?? modelModule) as ModelRegistry[string];
        })
        .catch(() => {
          // Skip failed module (e.g. not a model file)
        })
    );
  }

  await Promise.all(loadPromises);
  associate(models);
  return models;
}

export default loadModels();
