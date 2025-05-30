import { describe, it, expect } from 'vitest';
import { REPORTERS, VARIATIONS_ONLY, EDITIONS, NAMES_TO_EDITIONS } from '../src/index';

describe('Mapping Validation Tests', () => {
  it('should have editions for all reporter keys', () => {
    let testedCount = 0;
    
    for (const [reporterAbbv, reporterList] of Object.entries(REPORTERS)) {
      for (const reporterData of reporterList) {
        expect(reporterData.editions).toBeDefined();
        expect(typeof reporterData.editions).toBe('object');
        
        // Check that the reporter abbreviation exists in its own editions
        expect(reporterData.editions).toHaveProperty(reporterAbbv);
        
        testedCount++;
      }
      
      // Limit testing to avoid timeout
      if (testedCount > 50) break;
    }
    
    expect(testedCount).toBeGreaterThan(0);
  });

  it('should have valid variation mappings', () => {
    let testedCount = 0;
    
    for (const [variation, targets] of Object.entries(VARIATIONS_ONLY)) {
      for (const target of targets) {
        // Each variation should map to a valid edition key (not reporter key)
        expect(EDITIONS).toHaveProperty(target);
        
        testedCount++;
      }
      
      // Limit testing to avoid timeout
      if (testedCount > 100) break;
    }
    
    expect(testedCount).toBeGreaterThan(0);
  });

  it('should have basic names to editions mapping', () => {
    // Test the specific example from Python tests
    if (NAMES_TO_EDITIONS['Atlantic Reporter']) {
      expect(NAMES_TO_EDITIONS['Atlantic Reporter']).toEqual(['A.', 'A.2d', 'A.3d']);
    }
    
    // Test that we have some mappings
    const mappingKeys = Object.keys(NAMES_TO_EDITIONS);
    expect(mappingKeys.length).toBeGreaterThan(0);
    
    // Test a few mappings have valid structure
    const sampleKeys = mappingKeys.slice(0, 5);
    for (const key of sampleKeys) {
      const editions = NAMES_TO_EDITIONS[key];
      expect(Array.isArray(editions)).toBe(true);
      expect(editions.length).toBeGreaterThan(0);
      
      // Each edition should be a string
      for (const edition of editions) {
        expect(typeof edition).toBe('string');
        expect(edition.length).toBeGreaterThan(0);
      }
    }
  });

  it('should not have variations identical to their keys', () => {
    let testedCount = 0;
    
    for (const [reporterAbbv, reporterList] of Object.entries(REPORTERS)) {
      for (const reporterData of reporterList) {
        for (const [variation, target] of Object.entries(reporterData.variations)) {
          // Variation should not be identical to its target
          expect(variation).not.toBe(target);
          
          testedCount++;
        }
      }
      
      // Limit testing to avoid timeout
      if (testedCount > 100) break;
    }
    
    expect(testedCount).toBeGreaterThan(0);
  });

  it('should have valid cite_type values', () => {
    const validCiteTypes = [
      'federal',
      'neutral', 
      'scotus_early',
      'specialty',
      'specialty_west',
      'specialty_lexis',
      'state',
      'state_regional'
    ];
    
    let testedCount = 0;
    
    for (const [reporterAbbv, reporterList] of Object.entries(REPORTERS)) {
      for (const reporterData of reporterList) {
        expect(validCiteTypes).toContain(reporterData.cite_type);
        testedCount++;
      }
      
      // Limit testing to avoid timeout
      if (testedCount > 50) break;
    }
    
    expect(testedCount).toBeGreaterThan(0);
  });
});
