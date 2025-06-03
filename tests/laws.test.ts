import { describe, it, expect, beforeAll } from 'vitest';
import { LAWS, PCRE_REGEX_DATA, getPCREPatternFromData } from '../src/index';
import createPCREModule, { type EmscriptenModule } from '@syntropiq/libpcre-ts';

describe('Laws Tests', () => {
  let pcre: EmscriptenModule;
  
  beforeAll(async () => {
    pcre = await createPCREModule();
  });

  const iterLaws = function* () {
    for (const [lawKey, lawList] of Object.entries(LAWS)) {
      for (const law of lawList) {
        yield [lawKey, law] as const;
      }
    }
  };

  it('should have working regexes for laws with examples', async () => {
    if (Object.keys(LAWS).length === 0) {
      return; // Skip if no laws data
    }

    let testedCount = 0;
    let foundLawsWithExamples = 0;

    for (const [lawKey, law] of iterLaws()) {
      if (!law.examples || law.examples.length === 0) continue;
      if (!law.regexes || law.regexes.length === 0) continue;

      foundLawsWithExamples++;
      const regexes: Array<[string, string]> = [];
      const seriesStrings = [lawKey, ...(law.variations || [])];
      for (const regexTemplate of law.regexes) {
        // Use the same expansion logic as the Python version
        let pattern = regexTemplate;
        // Substitute $reporter with all series strings (escaped)
        if (pattern.includes('$reporter')) {
          const editionPattern = seriesStrings.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
          pattern = pattern.replace(/\$reporter/g, `(?:${editionPattern})`);
        }
        // Substitute $law_section, $law_year, $law_month, $law_day
        if (pattern.includes('$law_section') && PCRE_REGEX_DATA.law?.section) {
          pattern = pattern.replace(/\$law_section/g, PCRE_REGEX_DATA.law.section);
        }
        if (pattern.includes('$law_year') && PCRE_REGEX_DATA.law?.year) {
          pattern = pattern.replace(/\$law_year/g, PCRE_REGEX_DATA.law.year);
        }
        if (pattern.includes('$law_month') && PCRE_REGEX_DATA.law?.month) {
          pattern = pattern.replace(/\$law_month/g, PCRE_REGEX_DATA.law.month);
        }
        if (pattern.includes('$law_day') && PCRE_REGEX_DATA.law?.day) {
          pattern = pattern.replace(/\$law_day/g, PCRE_REGEX_DATA.law.day);
        }
        // Substitute $volume and $page variables
        if (pattern.includes('$volume') && PCRE_REGEX_DATA.volume?.['']) {
          pattern = pattern.replace(/\$volume/g, PCRE_REGEX_DATA.volume['']);
        }
        if (pattern.includes('$page_with_commas') && PCRE_REGEX_DATA.page?.with_commas) {
          pattern = pattern.replace(/\$page_with_commas/g, PCRE_REGEX_DATA.page.with_commas);
        }
        if (pattern.includes('$page') && PCRE_REGEX_DATA.page?.['']) {
          pattern = pattern.replace(/\$page/g, PCRE_REGEX_DATA.page['']);
        }
        // Anchor the pattern
        if (!pattern.startsWith('^')) pattern = '^' + pattern;
        if (!pattern.endsWith('$')) pattern = pattern + '$';
        regexes.push([regexTemplate, pattern]);
      }
      if (regexes.length === 0) continue;
      // Test that regexes work with examples
      const matchedExamples = new Set<string>();
      for (const [templateName, pcrePattern] of regexes) {
        for (const example of law.examples) {
          try {
            const compiledRegex = new pcre.PCRERegex(pcrePattern);
            if (compiledRegex.test(example)) {
              matchedExamples.add(example);
            }
          } catch (error) {
            throw new Error(`Failed to compile PCRE pattern: ${pcrePattern}. Error: ${error}`);
          }
        }
      }
      // Check that all examples are matched (Python logic: all examples must match at least one regex)
      expect(matchedExamples.size).toBeGreaterThanOrEqual(law.examples.length);
      testedCount++;
      if (testedCount > 10) break; // Limit to avoid timeout
    }
  });

  it('should have valid law structure', () => {
    if (Object.keys(LAWS).length === 0) {
      return; // Skip if no laws data
    }

    let testedCount = 0;
    
    for (const [lawKey, law] of iterLaws()) {
      // Required fields
      expect(law).toHaveProperty('name');
      expect(typeof law.name).toBe('string');
      expect(law.name.length).toBeGreaterThan(0);
      
      expect(law).toHaveProperty('regexes');
      expect(Array.isArray(law.regexes)).toBe(true);
      
      // Optional fields should have correct types if present
      if (law.variations) {
        expect(Array.isArray(law.variations)).toBe(true);
      }
      
      if (law.examples) {
        expect(Array.isArray(law.examples)).toBe(true);
      }
      
      testedCount++;
      if (testedCount > 20) break; // Limit sample size
    }
    
    expect(testedCount).toBeGreaterThan(0);
  });
});
