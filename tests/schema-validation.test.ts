import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import Ajv from 'ajv';

describe('Schema Validation Tests', () => {
  const dataDir = join(__dirname, '../reporters_db/data');
  const schemaDir = join(__dirname, '../schemas');
  const ajv = new Ajv();

  const testSchemaValidation = (fileName: string) => {
    it(`should validate ${fileName} against its schema`, () => {
      const dataPath = join(dataDir, fileName);
      const schemaPath = join(schemaDir, fileName);
      
      const data = JSON.parse(readFileSync(dataPath, 'utf-8'));
      const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
      
      const validate = ajv.compile(schema);
      const valid = validate(data);
      
      if (!valid) {
        console.error('Schema validation errors:', validate.errors);
      }
      
      expect(valid).toBe(true);
    });
  };

  testSchemaValidation('reporters.json');
  testSchemaValidation('laws.json');
  testSchemaValidation('journals.json');
  testSchemaValidation('regexes.json');
});
