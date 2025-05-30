import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('JSON Format Tests', () => {
  const dataDir = join(__dirname, '../reporters_db/data');
  
  const testJsonFormat = (fileName: string) => {
    it(`should have properly formatted ${fileName}`, () => {
      const filePath = join(dataDir, fileName);
      const content = readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      
      // Re-format with standard formatting
      const reformatted = JSON.stringify(parsed, null, 4) + '\n';
      
      expect(content).toBe(reformatted);
    });
  };

  testJsonFormat('reporters.json');
  testJsonFormat('laws.json');
  testJsonFormat('journals.json');
  testJsonFormat('regexes.json');
  testJsonFormat('state_abbreviations.json');
  testJsonFormat('case_name_abbreviations.json');
});
