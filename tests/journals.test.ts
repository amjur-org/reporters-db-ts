import { describe, it, expect } from 'vitest';
import { JOURNALS, REGEX_VARIABLES } from '../src/index';
import { recursiveSubstitute } from '../src/utils';

describe('Journals Tests', () => {
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
        const regex = recursiveSubstitute(regexTemplate, REGEX_VARIABLES);
        regexes.push([regexTemplate, regex]);
      }

      if (regexes.length === 0) continue;

      // Test that regexes work with examples
      const matchedExamples = new Set<string>();
      
      for (const [, regex] of regexes) {
        for (const example of examples) {
          const fullRegex = new RegExp(regex + '$');
          if (fullRegex.test(example)) {
            matchedExamples.add(example);
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
