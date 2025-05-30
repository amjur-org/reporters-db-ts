import { describe, it, expect } from 'vitest';
import { REPORTERS } from '../src/index';

describe('Variations Structure Tests', () => {
  it('should have valid variations structure in sample reporters', () => {
    const jurisdictions = Object.keys(REPORTERS);
    const firstJurisdiction = jurisdictions[0];
    
    if (!firstJurisdiction || !REPORTERS[firstJurisdiction]) {
      throw new Error('No reporters found to test');
    }
    
    const sampleReporters = REPORTERS[firstJurisdiction].slice(0, 2); // Test first 2
    
    sampleReporters.forEach(reporter => {
      expect(reporter.variations).toBeDefined();
      expect(typeof reporter.variations).toBe('object');
      
      // Variations should be Record<string, string>
      Object.entries(reporter.variations).forEach(([key, value]) => {
        expect(typeof key).toBe('string');
        expect(typeof value).toBe('string');
        expect(key.length).toBeGreaterThan(0);
        expect(value.length).toBeGreaterThan(0);
      });
    });
  });

  it('should have meaningful variation keys and values', () => {
    const jurisdictions = Object.keys(REPORTERS);
    const firstJurisdiction = jurisdictions[0];
    
    if (!firstJurisdiction || !REPORTERS[firstJurisdiction]) {
      return; // Skip if no data
    }
    
    const sampleReporters = REPORTERS[firstJurisdiction].slice(0, 2);
    
    sampleReporters.forEach(reporter => {
      Object.entries(reporter.variations).forEach(([key, value]) => {
        // Keys and values should not be just whitespace
        expect(key.trim().length).toBeGreaterThan(0);
        expect(value.trim().length).toBeGreaterThan(0);
        
        // Values should not be the same as keys (basic sanity check)
        expect(key).not.toBe(value);
      });
    });
  });
});
