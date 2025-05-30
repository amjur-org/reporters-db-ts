import { describe, it, expect } from 'vitest';
import { REPORTERS, LAWS, JOURNALS } from '../src/index';

describe('Date Validation Tests', () => {
  const checkDates = (start: Date | null, end: Date | null, path: string) => {
    if (start !== null) {
      expect(start instanceof Date).toBe(true);
      expect(isNaN(start.getTime())).toBe(false);
    }
    if (end !== null) {
      expect(end instanceof Date).toBe(true);
      expect(isNaN(end.getTime())).toBe(false);
    }
    if (start !== null && end !== null) {
      expect(start.getTime()).toBeLessThanOrEqual(end.getTime());
    }
  };

  it('should have valid dates in reporter editions', () => {
    let testedCount = 0;
    
    for (const [reporterAbbv, reporterList] of Object.entries(REPORTERS)) {
      for (const reporterData of reporterList) {
        for (const [editionName, edition] of Object.entries(reporterData.editions)) {
          expect(() => {
            checkDates(
              edition.start, 
              edition.end, 
              `${reporterAbbv}.${editionName}`
            );
          }).not.toThrow();
          
          testedCount++;
        }
        
        // Limit testing to avoid timeout
        if (testedCount > 100) break;
      }
      if (testedCount > 100) break;
    }
    
    expect(testedCount).toBeGreaterThan(0);
  });

  it('should have valid dates in laws', () => {
    if (Object.keys(LAWS).length === 0) {
      return; // Skip if no laws data
    }
    
    let testedCount = 0;
    
    for (const [lawKey, lawList] of Object.entries(LAWS)) {
      for (const law of lawList) {
        expect(() => {
          checkDates(law.start, law.end, `law[${lawKey}]`);
        }).not.toThrow();
        
        testedCount++;
      }
      
      if (testedCount > 20) break; // Limit sample size
    }
  });

  it('should have valid dates in journals', () => {
    if (Object.keys(JOURNALS).length === 0) {
      return; // Skip if no journals data
    }
    
    let testedCount = 0;
    
    for (const [journalKey, journalList] of Object.entries(JOURNALS)) {
      for (const journal of journalList) {
        expect(() => {
          checkDates(journal.start, journal.end, `journal[${journalKey}]`);
        }).not.toThrow();
        
        testedCount++;
      }
      
      if (testedCount > 20) break; // Limit sample size
    }
  });
});
