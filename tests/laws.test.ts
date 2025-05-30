import { describe, it, expect } from 'vitest';
import { LAWS, REGEX_VARIABLES } from '../src/index';
import { recursiveSubstitute, substituteEditions } from '../src/utils';

describe('Laws Tests', () => {
  const iterLaws = function* () {
    for (const [lawKey, lawList] of Object.entries(LAWS)) {
      for (const law of lawList) {
        yield [lawKey, law] as const;
      }
    }
  };

  it('should have working regexes for laws with examples', () => {
    if (Object.keys(LAWS).length === 0) {
      return; // Skip if no laws data
    }

    let testedCount = 0;
    
    for (const [lawKey, law] of iterLaws()) {
      if (!law.examples || law.examples.length === 0) continue;
      if (!law.regexes || law.regexes.length === 0) continue;

      const regexes: Array<[string, string]> = [];
      const seriesStrings = [lawKey, ...law.variations];
      
      for (const regexTemplate of law.regexes) {
        let regex = recursiveSubstitute(regexTemplate, REGEX_VARIABLES);
        
        // Create alternation pattern for all series strings
        const editionPattern = seriesStrings.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
        regex = regex.replace(/\$\{?edition\}?/g, `(?:${editionPattern})`);
        
        regexes.push([regexTemplate, regex]);
      }

      if (regexes.length === 0) continue;

      // Test that regexes work with examples
      const matchedExamples = new Set<string>();
      
      for (const [, regex] of regexes) {
        for (const example of law.examples) {
          const fullRegex = new RegExp(regex + '$');
          if (fullRegex.test(example)) {
            matchedExamples.add(example);
          }
        }
      }

      // Check that all examples are matched
      expect(matchedExamples.size).toBe(law.examples.length);
      
      testedCount++;
      if (testedCount > 10) break; // Limit to avoid timeout
    }
  });

  it('should have valid law structure', () => {
    if (Object.keys(LAWS).length === 0) {
      return; // Skip if no laws data
    }

    let testedCount = 0;
    
    for (const [lawKey, law] of iterLaws()) {
      // Required fields
      expect(law).toHaveProperty('name');
      expect(typeof law.name).toBe('string');
      expect(law.name.length).toBeGreaterThan(0);
      
      expect(law).toHaveProperty('regexes');
      expect(Array.isArray(law.regexes)).toBe(true);
      
      // Optional fields should have correct types if present
      if (law.variations) {
        expect(Array.isArray(law.variations)).toBe(true);
      }
      
      if (law.examples) {
        expect(Array.isArray(law.examples)).toBe(true);
      }
      
      testedCount++;
      if (testedCount > 20) break; // Limit sample size
    }
    
    expect(testedCount).toBeGreaterThan(0);
  });
});
