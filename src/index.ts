// CloudFlare Workers compatible imports - no file system operations
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

// Import JSON data directly as ES modules (bundler-friendly)
import reportersData from '../reporters_db/data/reporters.json';
import stateAbbreviationsData from '../reporters_db/data/state_abbreviations.json';
import caseNameAbbreviationsData from '../reporters_db/data/case_name_abbreviations.json';
import lawsData from '../reporters_db/data/laws.json';
import journalsData from '../reporters_db/data/journals.json';
import regexesData from '../reporters_db/data/regexes.json';
import pcreRegexData from '../regexes_pcre.json';

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
 * Parse JSON data with datetime parsing
 */
function parseJsonData<T>(data: any): T {
  return JSON.parse(JSON.stringify(data), datetimeParser) as T;
}

// Load all data files from bundled imports
export const REPORTERS: Reporters = parseJsonData(reportersData);
export const STATE_ABBREVIATIONS: StateAbbreviations = parseJsonData(stateAbbreviationsData);
export const CASE_NAME_ABBREVIATIONS: CaseNameAbbreviations = parseJsonData(caseNameAbbreviationsData);
export const LAWS: Laws = parseJsonData(lawsData);
export const JOURNALS: Journals = parseJsonData(journalsData);

// Process regex variables
export const REGEX_VARIABLES: RegexVariables = processVariables(regexesData);

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

// Export pre-converted PCRE regex data from bundled import
export const PCRE_REGEX_DATA = pcreRegexData;
