import { describe, it, expect } from 'vitest';
import { REPORTERS } from '../src/index';

describe('Required Fields Tests', () => {
  it('should have all required fields in sample reporters', () => {
    const jurisdictions = Object.keys(REPORTERS);
    const firstJurisdiction = jurisdictions[0];
    
    if (!firstJurisdiction || !REPORTERS[firstJurisdiction]) {
      throw new Error('No reporters found to test');
    }
    
    const sampleReporters = REPORTERS[firstJurisdiction].slice(0, 3); // Test first 3
    
    sampleReporters.forEach((reporter, index) => {
      expect(reporter).toHaveProperty('name');
      expect(typeof reporter.name).toBe('string');
      expect(reporter.name.length).toBeGreaterThan(0);
      
      expect(reporter).toHaveProperty('cite_type');
      expect(typeof reporter.cite_type).toBe('string');
      
      expect(reporter).toHaveProperty('editions');
      expect(typeof reporter.editions).toBe('object');
      
      expect(reporter).toHaveProperty('variations');
      expect(typeof reporter.variations).toBe('object');
    });
  });

  it('should have valid cite_type values in sample reporters', () => {
    const validCiteTypes = [
      'federal', 
      'state', 
      'neutral', 
      'specialty',
      'scotus_early',
      'specialty_west',
      'specialty_lexis',
      'state_regional'
    ];
    const jurisdictions = Object.keys(REPORTERS);
    
    // Test first jurisdiction only
    if (jurisdictions[0] && REPORTERS[jurisdictions[0]]) {
      const sampleReporters = REPORTERS[jurisdictions[0]].slice(0, 3);
      
      sampleReporters.forEach(reporter => {
        expect(validCiteTypes).toContain(reporter.cite_type);
      });
    }
  });
});
