// @ts-nocheck
import { expect } from 'chai';
import sinon from 'sinon';
import axios from 'axios';
import {
  fetchRemoteSchema,
  jsonSchemaToSchemaFieldDefinitions,
  buildModelMetadata,
  discoverSchemaForApiModel
} from '../../src/services/schema-discovery/index.js';

describe('Schema Discovery Service', function () {
  let axiosRequestStub: sinon.SinonStub;

  beforeEach(function () {
    axiosRequestStub = sinon.stub(axios, 'request');
  });

  afterEach(function () {
    axiosRequestStub.restore();
  });

  describe('fetchRemoteSchema', function () {
    it('returns parsed JSON when GET returns 200 and valid JSON', async function () {
      const data = { type: 'object', properties: { id: { type: 'string' } } };
      axiosRequestStub.resolves({ data, status: 200 });

      const result = await fetchRemoteSchema('https://api.example.com', 'users');
      expect(result).to.deep.equal(data);
      expect(axiosRequestStub.calledOnce).to.be.true;
      const callUrl = axiosRequestStub.firstCall.args[0]?.url ?? axiosRequestStub.firstCall.args[0];
      expect(String(callUrl)).to.include('/users/schema');
    });

    it('returns null when endpoint returns 404', async function () {
      axiosRequestStub.rejects({ response: { status: 404 } });

      const result = await fetchRemoteSchema('https://api.example.com', 'users');
      expect(result).to.equal(null);
    });

    it('returns null when response is not 2xx', async function () {
      axiosRequestStub.rejects({ response: { status: 500 } });

      const result = await fetchRemoteSchema('https://api.example.com', 'users');
      expect(result).to.equal(null);
    });

    it('returns null on network error', async function () {
      axiosRequestStub.rejects(new Error('Network error'));

      const result = await fetchRemoteSchema('https://api.example.com', 'users');
      expect(result).to.equal(null);
    });
  });

  describe('jsonSchemaToSchemaFieldDefinitions', function () {
    it('converts string, number, integer, boolean to SchemaFieldDefinition with correct type', function () {
      const schema = {
        properties: {
          a: { type: 'string' },
          b: { type: 'number' },
          c: { type: 'integer' },
          d: { type: 'boolean' }
        }
      };
      const result = jsonSchemaToSchemaFieldDefinitions(schema);
      expect(result.a.type).to.equal('String');
      expect(result.b.type).to.equal('Number');
      expect(result.c.type).to.equal('Number');
      expect(result.d.type).to.equal('Boolean');
    });

    it('maps description and required from JSON Schema', function () {
      const schema = {
        properties: {
          id: { type: 'string', description: 'The ID' },
          name: { type: 'string' }
        },
        required: ['id']
      };
      const result = jsonSchemaToSchemaFieldDefinitions(schema);
      expect(result.id.description).to.equal('The ID');
      expect(result.id.required).to.be.true;
      expect(result.name.required).to.be.false;
    });

    it('handles properties and builds paths record', function () {
      const schema = {
        properties: {
          id: { type: 'string' },
          name: { type: 'string' }
        }
      };
      const result = jsonSchemaToSchemaFieldDefinitions(schema);
      expect(Object.keys(result)).to.deep.equal(['id', 'name']);
      expect(result.id.type).to.equal('String');
      expect(result.name.type).to.equal('String');
    });

    it('handles missing or empty properties', function () {
      expect(jsonSchemaToSchemaFieldDefinitions({})).to.deep.equal({});
      expect(jsonSchemaToSchemaFieldDefinitions({ properties: {} })).to.deep.equal({});
      expect(jsonSchemaToSchemaFieldDefinitions(null)).to.deep.equal({});
      expect(jsonSchemaToSchemaFieldDefinitions(undefined)).to.deep.equal({});
    });

    it('handles invalid input without throwing', function () {
      expect(jsonSchemaToSchemaFieldDefinitions('not an object')).to.deep.equal({});
      expect(jsonSchemaToSchemaFieldDefinitions(42)).to.deep.equal({});
    });
  });

  describe('buildModelMetadata', function () {
    it('builds ModelMetadata with fields array', function () {
      const paths = {
        id: { type: 'String', description: 'ID', required: true },
        name: { type: 'String' }
      };
      const meta = buildModelMetadata('Test', paths, { description: 'Test model' });
      expect(meta.name).to.equal('Test');
      expect(meta.description).to.equal('Test model');
      expect(meta.fields).to.have.lengthOf(2);
      expect(meta.fields[0].name).to.equal('id');
      expect(meta.fields[0].type).to.equal('String');
      expect(meta.fields[0].required).to.be.true;
    });
  });

  describe('discoverSchemaForApiModel', function () {
    it('returns null when model has no _baseurl', async function () {
      const model = { _endpoint: 'users' };
      const result = await discoverSchemaForApiModel(model);
      expect(result).to.equal(null);
    });

    it('returns null when model has no _endpoint', async function () {
      const model = { _baseurl: 'https://api.example.com' };
      const result = await discoverSchemaForApiModel(model);
      expect(result).to.equal(null);
    });

    it('returns discovered schema metadata when remote schema succeeds', async function () {
      const remoteSchema = {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID' },
          name: { type: 'string' }
        },
        required: ['id']
      };
      axiosRequestStub.resolves({ data: remoteSchema, status: 200 });

      const model = {
        _baseurl: 'https://api.example.com',
        _endpoint: 'users',
        _schema: { options: { description: 'User model', mcpDescription: 'Users from API' } }
      };
      const result = await discoverSchemaForApiModel(model, 'Users');
      expect(result).to.not.equal(null);
      expect(result!.name).to.equal('Users');
      expect(result!.fields).to.have.lengthOf(2);
      expect(result!.fields.map((f) => f.name)).to.include('id', 'name');
      expect(result!.description).to.equal('User model');
    });

    it('returns null when remote schema fails so controller can fall back', async function () {
      axiosRequestStub.rejects(new Error('Network error'));

      const model = {
        _baseurl: 'https://api.example.com',
        _endpoint: 'users',
        _schema: { paths: { id: { type: String } }, options: {} }
      };
      const result = await discoverSchemaForApiModel(model, 'Users');
      expect(result).to.equal(null);
    });

    it('returns null when remote returns empty properties', async function () {
      axiosRequestStub.resolves({ data: { type: 'object', properties: {} }, status: 200 });

      const model = {
        _baseurl: 'https://api.example.com',
        _endpoint: 'users'
      };
      const result = await discoverSchemaForApiModel(model, 'Users');
      expect(result).to.equal(null);
    });
  });
});
