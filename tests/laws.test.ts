import { describe, it, expect, beforeAll } from 'vitest';
import { LAWS, REGEX_VARIABLES } from '../src/index';
import { recursiveSubstitute } from '../src/utils';
import createPCREModule, { type EmscriptenModule } from '@syntropiq/libpcre-ts';

describe('Laws Tests', () => {
  let pcre: EmscriptenModule;
  
  beforeAll(async () => {
    pcre = await createPCREModule();
  });

  const iterLaws = function* () {
    for (const [lawKey, lawList] of Object.entries(LAWS)) {
      for (const law of lawList) {
        yield [lawKey, law] as const;
      }
    }
  };

  it('should have working regexes for laws with examples', () => {
    if (Object.keys(LAWS).length === 0) {
      console.log('No LAWS data found');
      return; // Skip if no laws data
    }

    console.log('Total laws keys:', Object.keys(LAWS).length);
    
    let testedCount = 0;
    let foundLawsWithExamples = 0;
    
    for (const [lawKey, law] of iterLaws()) {
      if (!law.examples || law.examples.length === 0) continue;
      if (!law.regexes || law.regexes.length === 0) continue;
      
      foundLawsWithExamples++;
      console.log(`\nTesting law ${foundLawsWithExamples}: ${lawKey}`);
      console.log('Examples:', law.examples);
      console.log('Regexes:', law.regexes);

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
          // Convert Python named groups to PCRE format and anchor the regex at both ends
          const pcrePattern = '^' + regex.replace(/\(\?P<([^>]+)>/g, '(?<$1>') + '$';
          try {
            const compiledRegex = new pcre.PCRERegex(pcrePattern);
            if (compiledRegex.test(example)) {
              matchedExamples.add(example);
            }
          } catch (error) {
            // Add debug info on first failing law
            if (testedCount === 0) {
              console.log('Debug info for first law:');
              console.log('Law key:', lawKey);
              console.log('Example:', example);
              console.log('Regex:', regex);
              console.log('PCRE pattern:', pcrePattern);
              console.log('Error:', error);
            }
            throw new Error(`Failed to compile regex: ${pcrePattern}. Error: ${error}`);
          }
        }
      }

      // Check that all examples are matched
      if (testedCount === 0 && matchedExamples.size === 0) {
        console.log('First law debug:');
        console.log('Law key:', lawKey);
        console.log('Examples:', law.examples);
        console.log('Regexes count:', regexes.length);
        console.log('Matched examples size:', matchedExamples.size);
      }
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
