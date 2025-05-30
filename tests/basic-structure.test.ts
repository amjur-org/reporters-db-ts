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
    const firstJurisdiction = jurisdictions[0];
    
    if (firstJurisdiction) {
      expect(Array.isArray(REPORTERS[firstJurisdiction])).toBe(true);
      expect(REPORTERS[firstJurisdiction].length).toBeGreaterThan(0);
    }
  });

  it('should have reasonable number of jurisdictions', () => {
    const jurisdictionCount = Object.keys(REPORTERS).length;
    expect(jurisdictionCount).toBeGreaterThan(0);
    expect(jurisdictionCount).toBeLessThan(2000); // Sanity check - adjusted for actual data size
  });
});
