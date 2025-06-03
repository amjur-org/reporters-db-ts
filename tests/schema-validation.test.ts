import { describe, it, expect } from 'vitest';

// Instead of using fs and path, import JSON data and schemas directly for Cloudflare Workers compatibility
import reportersData from '../reporters_db/data/reporters.json';
import lawsData from '../reporters_db/data/laws.json';
import journalsData from '../reporters_db/data/journals.json';
import regexesData from '../reporters_db/data/regexes.json';

import reportersSchema from '../schemas/reporters.json';
import lawsSchema from '../schemas/laws.json';
import journalsSchema from '../schemas/journals.json';
import regexesSchema from '../schemas/regexes.json';

import Ajv from 'ajv';

describe('Schema Validation Tests', () => {
  const ajv = new Ajv();

  const testSchemaValidation = (data: any, schema: any, name: string) => {
    it(`should validate ${name} against its schema`, () => {
      const validate = ajv.compile(schema);
      const valid = validate(data);
      if (!valid) {
        console.error('Schema validation errors:', validate.errors);
      }
      expect(valid).toBe(true);
    });
  };

  testSchemaValidation(reportersData, reportersSchema, 'reporters.json');
  testSchemaValidation(lawsData, lawsSchema, 'laws.json');
  testSchemaValidation(journalsData, journalsSchema, 'journals.json');
  testSchemaValidation(regexesData, regexesSchema, 'regexes.json');
});
