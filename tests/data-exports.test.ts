import { describe, it, expect } from 'vitest';
import { 
  STATE_ABBREVIATIONS, 
  CASE_NAME_ABBREVIATIONS,
  LAWS,
  JOURNALS,
  VARIATIONS_ONLY,
  EDITIONS,
  NAMES_TO_EDITIONS,
  SPECIAL_FORMATS,
  REGEX_VARIABLES
} from '../src/index';

describe('Data Exports Tests', () => {
  it('should export STATE_ABBREVIATIONS as object', () => {
    expect(typeof STATE_ABBREVIATIONS).toBe('object');
    expect(STATE_ABBREVIATIONS).not.toBeNull();
    
    const keys = Object.keys(STATE_ABBREVIATIONS);
    expect(keys.length).toBeGreaterThan(0);
    
    // Sample a few state abbreviations
    keys.slice(0, 3).forEach(key => {
      expect(typeof key).toBe('string');
      expect(typeof STATE_ABBREVIATIONS[key]).toBe('string');
      expect(key.length).toBeGreaterThan(0);
      expect(STATE_ABBREVIATIONS[key].length).toBeGreaterThan(0);
    });
  });

  it('should export CASE_NAME_ABBREVIATIONS as object', () => {
    expect(typeof CASE_NAME_ABBREVIATIONS).toBe('object');
    expect(CASE_NAME_ABBREVIATIONS).not.toBeNull();
    
    const keys = Object.keys(CASE_NAME_ABBREVIATIONS);
    expect(keys.length).toBeGreaterThan(0);
    
    // Sample a few case name abbreviations
    keys.slice(0, 3).forEach(key => {
      expect(typeof key).toBe('string');
      // Values can be either strings or objects
      const value = CASE_NAME_ABBREVIATIONS[key];
      expect(['string', 'object'].includes(typeof value)).toBe(true);
      if (typeof value === 'object') {
        expect(value).not.toBeNull();
      }
    });
  });

  it('should export LAWS as object', () => {
    expect(typeof LAWS).toBe('object');
    expect(LAWS).not.toBeNull();
    
    const keys = Object.keys(LAWS);
    if (keys.length > 0) {
      // If there are laws, test their structure
      const firstKey = keys[0];
      const lawsArray = LAWS[firstKey];
      expect(Array.isArray(lawsArray)).toBe(true);
      
      if (lawsArray.length > 0) {
        const firstLaw = lawsArray[0];
        expect(firstLaw).toHaveProperty('name');
        expect(typeof firstLaw.name).toBe('string');
        expect(firstLaw).toHaveProperty('regexes');
        expect(Array.isArray(firstLaw.regexes)).toBe(true);
      }
    }
  });

  it('should export JOURNALS as object', () => {
    expect(typeof JOURNALS).toBe('object');
    expect(JOURNALS).not.toBeNull();
    
    const keys = Object.keys(JOURNALS);
    if (keys.length > 0) {
      // If there are journals, test their structure
      const firstKey = keys[0];
      const journalsArray = JOURNALS[firstKey];
      expect(Array.isArray(journalsArray)).toBe(true);
      
      if (journalsArray.length > 0) {
        const firstJournal = journalsArray[0];
        expect(firstJournal).toHaveProperty('name');
        expect(typeof firstJournal.name).toBe('string');
        // regexes is optional for journals
        if (firstJournal.regexes) {
          expect(Array.isArray(firstJournal.regexes)).toBe(true);
        }
      }
    }
  });

  it('should export VARIATIONS_ONLY as object', () => {
    expect(typeof VARIATIONS_ONLY).toBe('object');
    expect(VARIATIONS_ONLY).not.toBeNull();
    
    const keys = Object.keys(VARIATIONS_ONLY);
    if (keys.length > 0) {
      const firstKey = keys[0];
      const variations = VARIATIONS_ONLY[firstKey];
      expect(Array.isArray(variations)).toBe(true);
      
      for (const variation of variations) {
        expect(typeof variation).toBe('string');
        expect(variation.length).toBeGreaterThan(0);
      }
    }
  });

  it('should export EDITIONS as object', () => {
    expect(typeof EDITIONS).toBe('object');
    expect(EDITIONS).not.toBeNull();
    
    const keys = Object.keys(EDITIONS);
    expect(keys.length).toBeGreaterThan(0);
    
    // Sample a few editions
    keys.slice(0, 3).forEach(key => {
      expect(typeof key).toBe('string');
      expect(typeof EDITIONS[key]).toBe('string');
      expect(key.length).toBeGreaterThan(0);
      expect(EDITIONS[key].length).toBeGreaterThan(0);
    });
  });

  it('should export NAMES_TO_EDITIONS as object', () => {
    expect(typeof NAMES_TO_EDITIONS).toBe('object');
    expect(NAMES_TO_EDITIONS).not.toBeNull();
    
    const keys = Object.keys(NAMES_TO_EDITIONS);
    if (keys.length > 0) {
      const firstKey = keys[0];
      const editions = NAMES_TO_EDITIONS[firstKey];
      expect(Array.isArray(editions)).toBe(true);
      
      for (const edition of editions) {
        expect(typeof edition).toBe('string');
        expect(edition.length).toBeGreaterThan(0);
      }
    }
  });

  it('should export SPECIAL_FORMATS as object', () => {
    expect(typeof SPECIAL_FORMATS).toBe('object');
    expect(SPECIAL_FORMATS).not.toBeNull();
  });

  it('should export REGEX_VARIABLES as object', () => {
    expect(typeof REGEX_VARIABLES).toBe('object');
    expect(REGEX_VARIABLES).not.toBeNull();
    
    const keys = Object.keys(REGEX_VARIABLES);
    if (keys.length > 0) {
      // Sample a few regex variables
      keys.slice(0, 3).forEach(key => {
        expect(typeof key).toBe('string');
        expect(typeof REGEX_VARIABLES[key]).toBe('string');
      });
    }
  });
});
