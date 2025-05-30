import { describe, it, expect } from 'vitest';
import { 
  STATE_ABBREVIATIONS, 
  CASE_NAME_ABBREVIATIONS,
  LAWS,
  JOURNALS 
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
});
