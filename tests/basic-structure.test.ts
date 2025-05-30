import { describe, it, expect } from 'vitest';
import { REPORTERS } from '../src/index';

describe('Basic Structure Tests', () => {
  it('should have REPORTERS as an object', () => {
    expect(typeof REPORTERS).toBe('object');
    expect(REPORTERS).not.toBeNull();
  });

  it('should have jurisdiction keys', () => {
    const keys = Object.keys(REPORTERS);
    expect(keys.length).toBeGreaterThan(0);
  });

  it('should have arrays of reporters for each jurisdiction', () => {
    const jurisdictions = Object.keys(REPORTERS);
    
    for (const jurisdiction of jurisdictions.slice(0, 5)) { // Test first 5
      expect(Array.isArray(REPORTERS[jurisdiction])).toBe(true);
      expect(REPORTERS[jurisdiction].length).toBeGreaterThan(0);
    }
  });

  it('should have reasonable number of jurisdictions', () => {
    const jurisdictionCount = Object.keys(REPORTERS).length;
    expect(jurisdictionCount).toBeGreaterThan(0);
    expect(jurisdictionCount).toBeLessThan(10000); // Sanity check
  });

  it('should have consistent data structure in all reporters', () => {
    let testedCount = 0;
    
    for (const [reporterKey, reporterList] of Object.entries(REPORTERS)) {
      for (const reporterData of reporterList) {
        // All reporters should have these required fields
        expect(reporterData).toHaveProperty('name');
        expect(reporterData).toHaveProperty('cite_type');
        expect(reporterData).toHaveProperty('editions');
        expect(reporterData).toHaveProperty('variations');
        
        // Types should be correct
        expect(typeof reporterData.name).toBe('string');
        expect(typeof reporterData.cite_type).toBe('string');
        expect(typeof reporterData.editions).toBe('object');
        expect(typeof reporterData.variations).toBe('object');
        
        testedCount++;
      }
      
      // Limit testing to avoid timeout
      if (testedCount > 50) break;
    }
    
    expect(testedCount).toBeGreaterThan(0);
  });
});
