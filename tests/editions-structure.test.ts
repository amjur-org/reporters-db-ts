import { describe, it, expect } from 'vitest';
import { REPORTERS } from '../src/index';

describe('Editions Structure Tests', () => {
  it('should have valid edition structure in sample reporters', () => {
    const jurisdictions = Object.keys(REPORTERS);
    const firstJurisdiction = jurisdictions[0];
    
    if (!firstJurisdiction || !REPORTERS[firstJurisdiction]) {
      throw new Error('No reporters found to test');
    }
    
    const sampleReporters = REPORTERS[firstJurisdiction].slice(0, 2); // Test first 2
    
    sampleReporters.forEach(reporter => {
      expect(reporter.editions).toBeDefined();
      expect(typeof reporter.editions).toBe('object');
      
      const editionKeys = Object.keys(reporter.editions);
      expect(editionKeys.length).toBeGreaterThan(0);
      
      editionKeys.forEach(editionKey => {
        const edition = reporter.editions[editionKey];
        
        // Edition should be an object
        expect(typeof edition).toBe('object');
        expect(edition).not.toBeNull();
        
        // Name property is optional, but if present should be a string
        if (edition.name) {
          expect(typeof edition.name).toBe('string');
          expect(edition.name.length).toBeGreaterThan(0);
        }
        
        // Should have start and end properties (can be null)
        expect(edition).toHaveProperty('start');
        expect(edition).toHaveProperty('end');
      });
    });
  });

  it('should have valid date fields in editions', () => {
    const jurisdictions = Object.keys(REPORTERS);
    const firstJurisdiction = jurisdictions[0];
    
    if (!firstJurisdiction || !REPORTERS[firstJurisdiction]) {
      return; // Skip if no data
    }
    
    const sampleReporters = REPORTERS[firstJurisdiction].slice(0, 2);
    
    sampleReporters.forEach(reporter => {
      Object.values(reporter.editions).forEach(edition => {
        // start and end can be Date objects or null
        if (edition.start !== null) {
          expect(edition.start instanceof Date || typeof edition.start === 'string').toBe(true);
        }
        if (edition.end !== null) {
          expect(edition.end instanceof Date || typeof edition.end === 'string').toBe(true);
        }
      });
    });
  });
});
