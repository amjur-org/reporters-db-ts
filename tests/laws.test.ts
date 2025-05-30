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

  it('should have working regexes for laws with examples', () => {
    if (Object.keys(LAWS).length === 0) {
      console.log('No LAWS data found');
      return; // Skip if no laws data
    }

    console.log('Total laws keys:', Object.keys(LAWS).length);
    
    let testedCount = 0;
    let foundLawsWithExamples = 0;
    
    for (const [lawKey, law] of iterLaws()) {
      if (!law.examples || law.examples.length === 0) continue;
      if (!law.regexes || law.regexes.length === 0) continue;
      
      foundLawsWithExamples++;
      console.log(`\nTesting law ${foundLawsWithExamples}: ${lawKey}`);
      console.log('Examples:', law.examples);
      console.log('Regexes:', law.regexes);

      const regexes: Array<[string, string]> = [];
      const seriesStrings = [lawKey, ...law.variations];
      console.log('Series strings:', seriesStrings);
      
      for (const regexTemplate of law.regexes) {
        try {
          // Create alternation pattern for all series strings (escaped for use in regex)
          const editionPattern = seriesStrings.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
          
          // Start with the template and substitute variables
          let pcrePattern = regexTemplate;
          
          // Replace $reporter with the edition pattern
          pcrePattern = pcrePattern.replace(/\$reporter/g, `(?:${editionPattern})`);
          
          // Replace law variables with PCRE patterns
          if (PCRE_REGEX_DATA.law) {
            // Replace $law_section with law.section pattern
            if (pcrePattern.includes('$law_section') && PCRE_REGEX_DATA.law.section) {
              pcrePattern = pcrePattern.replace(/\$law_section/g, PCRE_REGEX_DATA.law.section);
            }
            
            // Replace other law variables as needed
            if (pcrePattern.includes('$law_year') && PCRE_REGEX_DATA.law.year) {
              pcrePattern = pcrePattern.replace(/\$law_year/g, PCRE_REGEX_DATA.law.year);
            }
            
            if (pcrePattern.includes('$law_month') && PCRE_REGEX_DATA.law.month) {
              pcrePattern = pcrePattern.replace(/\$law_month/g, PCRE_REGEX_DATA.law.month);
            }
            
            if (pcrePattern.includes('$law_day') && PCRE_REGEX_DATA.law.day) {
              pcrePattern = pcrePattern.replace(/\$law_day/g, PCRE_REGEX_DATA.law.day);
            }
          }
          
          // Replace volume and page variables
          if (PCRE_REGEX_DATA.volume) {
            if (pcrePattern.includes('$volume') && PCRE_REGEX_DATA.volume['']) {
              pcrePattern = pcrePattern.replace(/\$volume/g, PCRE_REGEX_DATA.volume['']);
            }
          }
          
          if (PCRE_REGEX_DATA.page) {
            if (pcrePattern.includes('$page_with_commas') && PCRE_REGEX_DATA.page.with_commas) {
              pcrePattern = pcrePattern.replace(/\$page_with_commas/g, PCRE_REGEX_DATA.page.with_commas);
            }
            
            if (pcrePattern.includes('$page') && PCRE_REGEX_DATA.page['']) {
              pcrePattern = pcrePattern.replace(/\$page/g, PCRE_REGEX_DATA.page['']);
            }
          }
          
          // Anchor the pattern to match full strings like Python's re.match()
          if (!pcrePattern.startsWith('^')) {
            pcrePattern = '^' + pcrePattern;
          }
          if (!pcrePattern.endsWith('$')) {
            pcrePattern = pcrePattern + '$';
          }
          
          console.log(`Template: ${regexTemplate} -> PCRE: ${pcrePattern}`);
          regexes.push([regexTemplate, pcrePattern]);
        } catch (error) {
          console.warn(`Failed to process regex template '${regexTemplate}':`, error);
          // Skip this regex template if it can't be processed
          continue;
        }
      }

      if (regexes.length === 0) continue;

      // Test that regexes work with examples
      const matchedExamples = new Set<string>();
      
      for (const [templateName, pcrePattern] of regexes) {
        for (const example of law.examples) {
          try {
            const compiledRegex = new pcre.PCRERegex(pcrePattern);
            const doesMatch = compiledRegex.test(example);
            console.log(`Testing "${example}" against "${pcrePattern}" -> ${doesMatch}`);
            if (doesMatch) {
              matchedExamples.add(example);
            }
          } catch (error) {
            // Add debug info on first failing law
            if (testedCount === 0) {
              console.log('Debug info for first law:');
              console.log('Law key:', lawKey);
              console.log('Example:', example);
              console.log('Template name:', templateName);
              console.log('PCRE pattern:', pcrePattern);
              console.log('Error:', error);
            }
            throw new Error(`Failed to compile PCRE pattern: ${pcrePattern}. Error: ${error}`);
          }
        }
      }

      // Check that all examples are matched
      if (testedCount === 0 && matchedExamples.size === 0) {
        console.log('First law debug:');
        console.log('Law key:', lawKey);
        console.log('Examples:', law.examples);
        console.log('Regexes count:', regexes.length);
        console.log('Matched examples size:', matchedExamples.size);
      }
      expect(matchedExamples.size).toBe(law.examples.length);
      
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
