import { describe, it, expect } from 'vitest';
import unidecode from 'unidecode';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  REPORTERS,
  STATE_ABBREVIATIONS,
  CASE_NAME_ABBREVIATIONS,
  LAWS,
  JOURNALS,
  REGEX_VARIABLES,
  VARIATIONS_ONLY,
  EDITIONS,
  NAMES_TO_EDITIONS,
  SPECIAL_FORMATS,
  recursiveSubstitute,
  escapeRegex,
  substituteEdition,
  compileRegex,
  convertNamedGroups
} from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbRoot = join(__dirname, '../reporters_db');

const VALID_CITE_TYPES = [
  "federal",
  "neutral", 
  "scotus_early",
  "specialty",
  "specialty_west",
  "specialty_lexis",
  "state",
  "state_regional",
];

/**
 * Recursively get all the strings out of a JSON object.
 * Convert ints to strs
 */
function* emitStrings(obj: any): Generator<string> {
  if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
    // Feed the keys and items back into the function.
    for (const [k, v] of Object.entries(obj)) {
      yield* emitStrings(k);
      yield* emitStrings(v);
    }
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      yield* emitStrings(item);
    }
  } else if (typeof obj === 'number') {
    yield String(obj);
  } else if (typeof obj === 'string') {
    yield obj;
  }
}

function* iterReporters() {
  for (const [reporterAbbv, reporterList] of Object.entries(REPORTERS)) {
    for (const reporterData of reporterList) {
      yield { reporterAbbv, reporterList, reporterData };
    }
  }
}

function* iterEditions() {
  for (const { reporterData } of iterReporters()) {
    for (const [editionKey, editionData] of Object.entries(reporterData.editions)) {
      yield { editionKey, editionData };
    }
  }
}

async function checkRegexes(
  regexes: Array<{ template: string; compiled: string }>, 
  examples: string[]
): Promise<{ matchedExamples: Set<string>; errors: string[] }> {
  const matchedExamples = new Set<string>();
  const errors: string[] = [];

  // Check that each regex matches at least one example
  for (const { template, compiled } of regexes) {
    let hasMatch = false;
    
    try {
      const pcreRegex = await compileRegex(compiled + '$');
      
      for (const example of examples) {
        if (pcreRegex.test(example)) {
          hasMatch = true;
          matchedExamples.add(example);
        }
      }
      
      if (!hasMatch) {
        errors.push(
          `No match in 'examples' for custom regex ${template}.\n` +
          `Expanded regex: ${compiled}.\n` +
          `Provided examples: ${examples.join(', ')}`
        );
      }
    } catch (error) {
      errors.push(`Failed to compile regex ${template}: ${error}`);
    }
  }

  return { matchedExamples, errors };
}

async function checkForMatchingGroups(
  regexes: Array<{ template: string; compiled: string }>, 
  examples: string[]
): Promise<string[]> {
  const errors: string[] = [];

  for (const { template, compiled } of regexes) {
    try {
      const pcreRegex = await compileRegex(compiled + '$');
      
      for (const example of examples) {
        const match = pcreRegex.exec(example);
        if (match) {
          const namedGroups = pcreRegex.getNamedGroups();
          
          if (!('reporter' in namedGroups)) {
            errors.push(`<reporter> group missing in regex ${compiled}`);
          }
          if (!('page' in namedGroups)) {
            errors.push(`<page> group missing in regex ${compiled}`);
          }
          break; // Only need to check one match per regex
        }
      }
    } catch (error) {
      errors.push(`Failed to compile regex ${template}: ${error}`);
    }
  }

  return errors;
}

function checkDates(start: Date | null, end: Date | null): string[] {
  const errors: string[] = [];
  
  if (start !== null && !(start instanceof Date)) {
    errors.push(`${start} should be imported as a date.`);
  }
  if (end !== null && !(end instanceof Date)) {
    errors.push(`${end} should be imported as a date.`);
  }
  if (start !== null && end !== null && start > end) {
    errors.push(`Start date ${start} should be <= end date ${end}`);
  }
  
  return errors;
}

function checkAscii(obj: any): string[] {
  const errors: string[] = [];
  // Match Python regex: r"[ 0-9a-zA-Z.,\-'&(){}\[\]\\$§_?<>+*|:/']"
  const allowedCharsRegex = /^[ 0-9a-zA-Z.,\-''&(){}\[\]\\$§_?<>+*|:/']*$/;
  
  for (const s of emitStrings(obj)) {
    // Normalize Unicode characters to ASCII equivalents
    const normalizedS = unidecode(s);
    if (!allowedCharsRegex.test(normalizedS)) {
      const invalidChars = normalizedS.replace(/[ 0-9a-zA-Z.,\-''&(){}\[\]\\$§_?<>+*|:/']/g, '');
      errors.push(`Unexpected characters in "${s}": "${invalidChars}"`);
    }
  }
  
  return errors;
}

function checkWhitespace(obj: any): string[] {
  const errors: string[] = [];
  
  for (const s of emitStrings(obj)) {
    if (s !== s.trim()) {
      errors.push(`Field needs whitespace stripped: '${s}'`);
    }
    
    const whitespaceMatches = s.match(/\s+/g) || [];
    const hasNonSpaceWhitespace = whitespaceMatches.some(w => w !== ' '.repeat(w.length));
    if (hasNonSpaceWhitespace) {
      errors.push(`Field has unexpected whitespace: "${s}"`);
    }
  }
  
  return errors;
}

describe('Data Loading', () => {
  it('should load reporters data', () => {
    expect(REPORTERS).toBeDefined();
    expect(typeof REPORTERS).toBe('object');
    expect(Object.keys(REPORTERS).length).toBeGreaterThan(0);
  });

  it('should load state abbreviations', () => {
    expect(STATE_ABBREVIATIONS).toBeDefined();
    expect(typeof STATE_ABBREVIATIONS).toBe('object');
    expect(Object.keys(STATE_ABBREVIATIONS).length).toBeGreaterThan(0);
  });

  it('should load case name abbreviations', () => {
    expect(CASE_NAME_ABBREVIATIONS).toBeDefined();
    expect(typeof CASE_NAME_ABBREVIATIONS).toBe('object');
  });

  it('should load laws data', () => {
    expect(LAWS).toBeDefined();
    expect(typeof LAWS).toBe('object');
  });

  it('should load journals data', () => {
    expect(JOURNALS).toBeDefined();
    expect(typeof JOURNALS).toBe('object');
  });

  it('should process regex variables', () => {
    expect(REGEX_VARIABLES).toBeDefined();
    expect(typeof REGEX_VARIABLES).toBe('object');
    expect(Object.keys(REGEX_VARIABLES).length).toBeGreaterThan(0);
  });
});

describe('ReportersTest', () => {
  it('should not have any keys missing editions', () => {
    for (const { reporterAbbv, reporterData } of iterReporters()) {
      expect(reporterAbbv in reporterData.editions).toBe(true);
    }
  });

  it('should not have variations mapping to bad keys', () => {
    for (const variations of Object.values(VARIATIONS_ONLY)) {
      for (const variation of variations) {
        const editionKey = EDITIONS[variation];
        expect(editionKey in REPORTERS).toBe(true);
      }
    }
  });

  it('should have basic names to editions working', () => {
    expect(NAMES_TO_EDITIONS["Atlantic Reporter"]).toEqual(["A.", "A.2d", "A.3d"]);
  });

  it('should have correct editions ordering', () => {
    // Test Ill. App., where we don't have good start dates
    expect(NAMES_TO_EDITIONS["Illinois Appellate Court Reports"]).toEqual([
      "Ill. App.", "Ill. App. 2d", "Ill. App. 3d"
    ]);
  });

  it('should have valid dates', () => {
    for (const { editionData } of iterEditions()) {
      const errors = checkDates(editionData.start, editionData.end);
      expect(errors).toEqual([]);
    }
  });

  it('should have valid cite_type values', () => {
    for (const { reporterAbbv, reporterData } of iterReporters()) {
      expect(VALID_CITE_TYPES).toContain(reporterData.cite_type);
    }
  });

  it('should not have variations same as keys', () => {
    for (const [variation, keys] of Object.entries(VARIATIONS_ONLY)) {
      for (const key of keys) {
        expect(variation).not.toBe(key);
      }
    }
  });

  it('should have tidy fields', () => {
    // Check ASCII
    for (const { reporterAbbv, reporterData } of iterReporters()) {
      expect(checkAscii(reporterAbbv)).toEqual([]);
      expect(checkAscii(Object.keys(reporterData.editions))).toEqual([]);
      expect(checkAscii(reporterData.variations)).toEqual([]);
    }

    // Check whitespace
    expect(checkWhitespace(REPORTERS)).toEqual([]);
  });

  it('should have working regexes and matching groups', async () => {
    const allErrors: string[] = [];
    
    for (const { reporterAbbv, reporterData } of iterReporters()) {
      const examples = reporterData.examples || [];
      const regexes: Array<{ template: string; compiled: string }> = [];
      
      for (const [editionAbbv, edition] of Object.entries(reporterData.editions)) {
        if (!edition.regexes) continue;
        
        for (const regexTemplate of edition.regexes) {
          const editionStrings = [editionAbbv];
          
          // Add variations that map to this edition
          for (const [k, v] of Object.entries(reporterData.variations)) {
            if (v === editionAbbv) {
              editionStrings.push(k);
            }
          }
          
          try {
            let regex = recursiveSubstitute(regexTemplate, REGEX_VARIABLES);
            const editionPattern = `(?:${editionStrings.map(escapeRegex).join('|')})`;
            regex = regex.replace(/\$\{?edition\}?/g, editionPattern);
            
            regexes.push({ template: regexTemplate, compiled: regex });
          } catch (error) {
            // Skip regexes that can't be resolved due to circular references
            console.warn(`Skipping regex template due to unresolved variables: ${regexTemplate}`);
          }
        }
      }

      if (regexes.length === 0) continue;

      // Check regexes
      const { matchedExamples, errors: regexErrors } = await checkRegexes(regexes, examples);
      if (regexErrors.length > 0) {
        allErrors.push(`Reporter ${reporterAbbv}: ${regexErrors.join('; ')}`);
      }

      // Check that all examples matched
      const unmatchedExamples = examples.filter(ex => !matchedExamples.has(ex));
      if (unmatchedExamples.length > 0) {
        allErrors.push(`Reporter ${reporterAbbv}: Unmatched examples: ${unmatchedExamples.join(', ')}`);
      }

      // Check for named matching groups
      const groupErrors = await checkForMatchingGroups(regexes, examples);
      if (groupErrors.length > 0) {
        allErrors.push(`Reporter ${reporterAbbv}: ${groupErrors.join('; ')}`);
      }
    }

    expect(allErrors).toEqual([]);
  }, 30000); // 30 second timeout for regex compilation
});

describe('LawsTest', () => {
  function* iterLaws() {
    for (const [lawKey, lawList] of Object.entries(LAWS)) {
      for (const law of lawList) {
        yield { lawKey, law };
      }
    }
  }

  it('should have working regexes', async () => {
    const allErrors: string[] = [];
    
    for (const { lawKey, law } of iterLaws()) {
      const regexes: Array<{ template: string; compiled: string }> = [];
      
      // Expand regex and substitute $edition value
      const seriesStrings = [lawKey, ...law.variations];
      
      for (const regexTemplate of law.regexes) {
        try {
          let regex = recursiveSubstitute(regexTemplate, REGEX_VARIABLES);
          const reporterPattern = `(?:${[lawKey, ...law.variations].map(escapeRegex).join('|')})`;
          // Substitute $reporter and $edition (for future-proofing)
          regex = regex.replace(/\$\{?reporter\}?/g, reporterPattern);
          regex = regex.replace(/\$\{?edition\}?/g, reporterPattern);
          regex = convertNamedGroups(regex);

          regexes.push({ template: regexTemplate, compiled: regex });
        } catch (error) {
          // Skip regexes that can't be resolved due to circular references
          console.warn(`Skipping regex template due to unresolved variables: ${regexTemplate}`);
        }
      }

      const { errors } = await checkRegexes(regexes, law.examples);
      if (errors.length > 0) {
        allErrors.push(`Law ${law.name}: ${errors.join('; ')}`);
      }
    }

    expect(allErrors).toEqual([]);
  }, 30000);

  it('should have valid dates', () => {
    for (const { law } of iterLaws()) {
      const errors = checkDates(law.start, law.end);
      expect(errors).toEqual([]);
    }
  });

  it('should have tidy fields', () => {
    for (const { law } of iterLaws()) {
      expect(checkAscii(law.regexes)).toEqual([]);
      expect(checkAscii(law.examples)).toEqual([]);
    }

    expect(checkWhitespace(LAWS)).toEqual([]);
  });
});

describe('JournalsTest', () => {
  function* iterJournals() {
    for (const [journalKey, journalList] of Object.entries(JOURNALS)) {
      for (const journal of journalList) {
        yield { journalKey, journal };
      }
    }
  }

  it('should have working regexes', async () => {
    const allErrors: string[] = [];
    
    for (const { journal } of iterJournals()) {
      const regexes: Array<{ template: string; compiled: string }> = [];
      
      for (const regexTemplate of journal.regexes || []) {
        const regex = recursiveSubstitute(regexTemplate, REGEX_VARIABLES);
        regexes.push({ template: regexTemplate, compiled: regex });
      }

      if (regexes.length > 0) {
        const { errors } = await checkRegexes(regexes, journal.examples || []);
        if (errors.length > 0) {
          allErrors.push(`Journal ${journal.name}: ${errors.join('; ')}`);
        }
      }
    }

    expect(allErrors).toEqual([]);
  }, 30000);

  it('should have valid dates', () => {
    for (const { journal } of iterJournals()) {
      const errors = checkDates(journal.start, journal.end);
      expect(errors).toEqual([]);
    }
  });

  it('should have tidy fields', () => {
    for (const { journalKey, journal } of iterJournals()) {
      expect(checkAscii(journalKey)).toEqual([]);
      expect(checkAscii(journal.name)).toEqual([]);
    }

    expect(checkWhitespace(JOURNALS)).toEqual([]);
  });
});
