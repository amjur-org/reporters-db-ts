import { describe, it, expect, beforeAll } from 'vitest';
import { LAWS, PCRE_REGEX_DATA, getPCREPatternFromData, REGEX_VARIABLES, recursiveSubstitute } from '../src/index';
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

  it('should have working regexes for laws with examples', async () => {
    if (Object.keys(LAWS).length === 0) {
      return; // Skip if no laws data
    }

    let testedCount = 0;
    let foundLawsWithExamples = 0;

    for (const [lawKey, law] of iterLaws()) {
      if (!law.examples || law.examples.length === 0) continue;
      if (!law.regexes || law.regexes.length === 0) continue;

      foundLawsWithExamples++;
      console.log(`\n=== Testing Law: ${law.name} (${lawKey}) ===`);
      console.log(`Examples: ${JSON.stringify(law.examples)}`);
      console.log(`Templates: ${JSON.stringify(law.regexes)}`);
      
      const regexes: Array<[string, string]> = [];
      const seriesStrings = [lawKey, ...(law.variations || [])];
      console.log(`Series strings: ${JSON.stringify(seriesStrings)}`);
      
      for (const regexTemplate of law.regexes) {
        console.log(`\nProcessing template: ${regexTemplate}`);
        
        // Step 1: Apply recursive substitution first (like Python)
        let pattern = recursiveSubstitute(regexTemplate, REGEX_VARIABLES);
        console.log(`After recursiveSubstitute: ${pattern}`);
        
        // Step 2: Substitute $edition (like Python)
        if (pattern.includes('$edition')) {
          const editionPattern = seriesStrings.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
          pattern = pattern.replace(/\$edition/g, `(?:${editionPattern})`);
          console.log(`After $edition substitution: ${pattern}`);
        }
        
        // Legacy: also handle $reporter for backward compatibility
        if (pattern.includes('$reporter')) {
          const editionPattern = seriesStrings.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
          pattern = pattern.replace(/\$reporter/g, `(?:${editionPattern})`);
          console.log(`After $reporter substitution: ${pattern}`);
        }
        
        // Anchor the pattern
        if (!pattern.startsWith('^')) pattern = '^' + pattern;
        if (!pattern.endsWith('$')) pattern = pattern + '$';
        console.log(`Final pattern: ${pattern}`);
        
        regexes.push([regexTemplate, pattern]);
      }
      if (regexes.length === 0) continue;
      // Test that regexes work with examples
      const matchedExamples = new Set<string>();
      for (const [templateName, pcrePattern] of regexes) {
        console.log(`\nTesting pattern: ${pcrePattern}`);
        for (const example of law.examples) {
          try {
            const compiledRegex = new pcre.PCRERegex(pcrePattern);
            const matches = compiledRegex.test(example);
            console.log(`  "${example}" -> ${matches ? 'MATCH' : 'NO MATCH'}`);
            if (matches) {
              matchedExamples.add(example);
            }
          } catch (error) {
            console.error(`Failed to compile PCRE pattern: ${pcrePattern}. Error: ${error}`);
            throw new Error(`Failed to compile PCRE pattern: ${pcrePattern}. Error: ${error}`);
          }
        }
      }
      
      console.log(`\nMatched examples: ${matchedExamples.size}/${law.examples.length}`);
      // Check that all examples are matched (Python logic: all examples must match at least one regex)
      expect(matchedExamples.size).toBeGreaterThanOrEqual(law.examples.length);
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
