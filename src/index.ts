import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  suckOutVariationsOnly,
  suckOutEditions,
  suckOutFormats,
  namesToAbbreviations,
  processVariables
} from './utils.js';
import type {
  Reporters,
  Laws,
  Journals,
  StateAbbreviations,
  CaseNameAbbreviations,
  RegexVariables,
  VariationsOnly,
  Editions,
  NamesToEditions,
  SpecialFormats,
  ReporterData,
  LawData,
  JournalData,
  EditionData
} from './types.js';

// Get the directory of this module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbRoot = join(__dirname, '../reporters_db');

/**
 * Parse datetime strings in JSON data
 */
function datetimeParser(key: string, value: unknown): unknown {
  if ((key === 'start' || key === 'end') && typeof value === 'string') {
    return new Date(value);
  }
  return value;
}

/**
 * Load and parse JSON data with datetime parsing
 */
function loadJsonData<T>(filePath: string): T {
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content, datetimeParser) as T;
}

// Load all data files
export const REPORTERS: Reporters = loadJsonData(join(dbRoot, 'data', 'reporters.json'));

export const STATE_ABBREVIATIONS: StateAbbreviations = loadJsonData(
  join(dbRoot, 'data', 'state_abbreviations.json')
);

export const CASE_NAME_ABBREVIATIONS: CaseNameAbbreviations = loadJsonData(
  join(dbRoot, 'data', 'case_name_abbreviations.json')
);

export const LAWS: Laws = loadJsonData(join(dbRoot, 'data', 'laws.json'));

export const JOURNALS: Journals = loadJsonData(join(dbRoot, 'data', 'journals.json'));

// Load and process regex variables
const RAW_REGEX_VARIABLES = loadJsonData<Record<string, unknown>>(
  join(dbRoot, 'data', 'regexes.json')
);
export const REGEX_VARIABLES: RegexVariables = processVariables(RAW_REGEX_VARIABLES);

// Generate derived data structures
export const VARIATIONS_ONLY: VariationsOnly = suckOutVariationsOnly(REPORTERS);
export const EDITIONS: Editions = suckOutEditions(REPORTERS);
export const NAMES_TO_EDITIONS: NamesToEditions = namesToAbbreviations(REPORTERS);
export const SPECIAL_FORMATS: SpecialFormats = suckOutFormats(REPORTERS);

// Re-export utility functions
export {
  suckOutVariationsOnly,
  suckOutEditions,
  suckOutFormats,
  namesToAbbreviations,
  processVariables,
  recursiveSubstitute,
  escapeRegex,
  substituteEdition,
  substituteEditions,
  convertNamedGroups,
  getPCREPatternFromData
} from './utils.js';

export { compileRegex } from './compileRegex.js';

// Re-export types
export type {
  Reporters,
  Laws,
  Journals,
  StateAbbreviations,
  CaseNameAbbreviations,
  RegexVariables,
  VariationsOnly,
  Editions,
  NamesToEditions,
  SpecialFormats,
  ReporterData,
  LawData,
  JournalData,
  EditionData
} from './types.js';

// Load converted PCRE regexes
const regexDataPath = join(__dirname, '..', 'regexes_pcre.json');
let REGEX_DATA: any = {};
try {
  REGEX_DATA = JSON.parse(readFileSync(regexDataPath, 'utf8'));
} catch (error) {
  console.warn('Could not load converted regex data:', error);
}

// Export pre-converted PCRE regex data
export const PCRE_REGEX_DATA = REGEX_DATA;
