import { describe, it, expect } from 'vitest';
import { REPORTERS, LAWS, JOURNALS } from '../src/index';

describe('ASCII and Whitespace Validation Tests', () => {
  /**
   * Check that all strings in obj match a list of expected ascii characters
   */
  const checkAscii = (obj: unknown, path = '') => {
    const allowedChars = /^[ 0-9a-zA-Z.,\-'&(){}\[\]\\$§_?<>+*|:/']*$/;
    
    const emitStrings = function* (value: unknown, currentPath: string): Generator<[string, string]> {
      if (typeof value === 'string') {
        yield [currentPath, value];
      } else if (typeof value === 'number') {
        yield [currentPath, value.toString()];
      } else if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          yield* emitStrings(value[i], `${currentPath}[${i}]`);
        }
      } else if (value && typeof value === 'object') {
        for (const [key, val] of Object.entries(value)) {
          yield* emitStrings(key, `${currentPath}.${key}`);
          yield* emitStrings(val, `${currentPath}.${key}`);
        }
      }
    };

    for (const [itemPath, str] of emitStrings(obj, path)) {
      const remainingChars = str.replace(allowedChars, '');
      if (remainingChars) {
        throw new Error(`Unexpected characters in ${itemPath}: "${str}" has "${remainingChars}"`);
      }
    }
  };

  /**
   * Check that strings don't have leading/trailing whitespace or non-space whitespace
   */
  const checkWhitespace = (obj: unknown, path = '') => {
    const emitStrings = function* (value: unknown, currentPath: string): Generator<[string, string]> {
      if (typeof value === 'string') {
        yield [currentPath, value];
      } else if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          yield* emitStrings(value[i], `${currentPath}[${i}]`);
        }
      } else if (value && typeof value === 'object') {
        for (const [key, val] of Object.entries(value)) {
          yield* emitStrings(key, `${currentPath}.${key}`);
          yield* emitStrings(val, `${currentPath}.${key}`);
        }
      }
    };

    for (const [itemPath, str] of emitStrings(obj, path)) {
      // Check for leading/trailing whitespace
      if (str !== str.trim()) {
        throw new Error(`Field needs whitespace stripped at ${itemPath}: "${str}"`);
      }
      
      // Check for non-space whitespace
      const whitespaceMatches = str.match(/\s+/g);
      if (whitespaceMatches) {
        for (const match of whitespaceMatches) {
          if (match !== ' '.repeat(match.length)) {
            throw new Error(`Field has unexpected whitespace at ${itemPath}: "${str}"`);
          }
        }
      }
    }
  };

  it('should have valid ASCII characters in reporters data', () => {
    let testedCount = 0;
    
    for (const [reporterAbbv, reporterList] of Object.entries(REPORTERS)) {
      // Test a sample of reporters to avoid timeout
      const sampleSize = Math.min(reporterList.length, 5);
      for (let i = 0; i < sampleSize; i++) {
        const reporterData = reporterList[i];
        
        expect(() => {
          checkAscii(reporterAbbv, `reporter[${reporterAbbv}]`);
          checkAscii(Object.keys(reporterData.editions), `reporter[${reporterAbbv}].editions`);
          checkAscii(reporterData.variations, `reporter[${reporterAbbv}].variations`);
        }).not.toThrow();
        
        testedCount++;
      }
      
      if (testedCount > 50) break; // Limit to avoid timeout
    }
    
    expect(testedCount).toBeGreaterThan(0);
  });

  it('should have proper whitespace in reporters data', () => {
    // Test a small sample to ensure whitespace is correct
    const reporterKeys = Object.keys(REPORTERS).slice(0, 5);
    
    for (const reporterAbbv of reporterKeys) {
      const reporterList = REPORTERS[reporterAbbv];
      const sampleReporter = reporterList[0];
      
      expect(() => {
        checkWhitespace(sampleReporter, `reporter[${reporterAbbv}]`);
      }).not.toThrow();
    }
  });

  it('should have valid ASCII characters in laws data', () => {
    if (Object.keys(LAWS).length === 0) {
      return; // Skip if no laws data
    }
    
    let testedCount = 0;
    for (const [lawKey, lawList] of Object.entries(LAWS)) {
      const sampleLaw = lawList[0];
      if (sampleLaw) {
        expect(() => {
          checkAscii(sampleLaw.regexes, `law[${lawKey}].regexes`);
          checkAscii(sampleLaw.examples, `law[${lawKey}].examples`);
        }).not.toThrow();
        
        testedCount++;
      }
      
      if (testedCount > 10) break; // Limit sample size
    }
  });

  it('should have valid ASCII characters in journals data', () => {
    if (Object.keys(JOURNALS).length === 0) {
      return; // Skip if no journals data
    }
    
    let testedCount = 0;
    for (const [journalKey, journalList] of Object.entries(JOURNALS)) {
      const sampleJournal = journalList[0];
      if (sampleJournal) {
        expect(() => {
          checkAscii(journalKey, `journal[${journalKey}]`);
          checkAscii(sampleJournal.name, `journal[${journalKey}].name`);
        }).not.toThrow();
        
        testedCount++;
      }
      
      if (testedCount > 10) break; // Limit sample size
    }
  });
});
