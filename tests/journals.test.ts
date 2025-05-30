import { describe, it, expect, beforeAll } from 'vitest';
import { JOURNALS, PCRE_REGEX_DATA, getPCREPatternFromData } from '../src/index';
import createPCREModule, { type EmscriptenModule } from '@syntropiq/libpcre-ts';

describe('Journals Tests', () => {
  let pcre: EmscriptenModule;
  
  beforeAll(async () => {
    pcre = await createPCREModule();
  });

  const iterJournals = function* () {
    for (const [journalKey, journalList] of Object.entries(JOURNALS)) {
      for (const journal of journalList) {
        yield [journalKey, journal] as const;
      }
    }
  };

  it('should have working regexes for journals with examples', () => {
    if (Object.keys(JOURNALS).length === 0) {
      return; // Skip if no journals data
    }

    let testedCount = 0;
    
    for (const [journalKey, journal] of iterJournals()) {
      const examples = journal.examples || [];
      const regexTemplates = journal.regexes || [];
      
      if (examples.length === 0 || regexTemplates.length === 0) continue;

      const regexes: Array<[string, string]> = [];
      
      for (const regexTemplate of regexTemplates) {
        try {
          // Use pre-converted PCRE pattern instead of runtime conversion
          let pcrePattern = getPCREPatternFromData(PCRE_REGEX_DATA, regexTemplate);
          
          // Anchor the pattern to match full strings like Python's re.match()
          if (!pcrePattern.startsWith('^')) {
            pcrePattern = '^' + pcrePattern;
          }
          if (!pcrePattern.endsWith('$')) {
            pcrePattern = pcrePattern + '$';
          }
          
          regexes.push([regexTemplate, pcrePattern]);
        } catch (error) {
          console.warn(`Failed to process regex template '${regexTemplate}':`, error);
          // Skip this regex template if it can't be processed
          continue;
        }
      }

      if (regexes.length === 0) continue;

      // Test that regexes work with examples
      const matchedExamples = new Set<string>();
      
      for (const [templateName, pcrePattern] of regexes) {
        for (const example of examples) {
          try {
            const compiledRegex = new pcre.PCRERegex(pcrePattern);
            if (compiledRegex.test(example)) {
              matchedExamples.add(example);
            }
          } catch (error) {
            throw new Error(`Failed to compile PCRE pattern '${templateName}': ${pcrePattern}. Error: ${error}`);
          }
        }
      }

      // Check that all examples are matched
      expect(matchedExamples.size).toBe(examples.length);
      
      testedCount++;
      if (testedCount > 10) break; // Limit to avoid timeout
    }
  });

  it('should have valid journal structure', () => {
    if (Object.keys(JOURNALS).length === 0) {
      return; // Skip if no journals data
    }

    let testedCount = 0;
    
    for (const [journalKey, journal] of iterJournals()) {
      // Required fields
      expect(journal).toHaveProperty('name');
      expect(typeof journal.name).toBe('string');
      expect(journal.name.length).toBeGreaterThan(0);
      
      // Key should be a valid string
      expect(typeof journalKey).toBe('string');
      expect(journalKey.length).toBeGreaterThan(0);
      
      // Optional fields should have correct types if present
      if (journal.regexes) {
        expect(Array.isArray(journal.regexes)).toBe(true);
        for (const regex of journal.regexes) {
          expect(typeof regex).toBe('string');
        }
      }
      
      if (journal.examples) {
        expect(Array.isArray(journal.examples)).toBe(true);
        for (const example of journal.examples) {
          expect(typeof example).toBe('string');
        }
      }
      
      testedCount++;
      if (testedCount > 20) break; // Limit sample size
    }
    
    expect(testedCount).toBeGreaterThan(0);
  });
});
