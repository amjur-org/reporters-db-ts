/**
 * Type definitions for the reporters-db-ts library
 */

export interface EditionData {
  start: Date | null;
  end: Date | null;
  name: string;
  regexes?: string[];
  [key: string]: unknown;
}

export interface ReporterData {
  name: string;
  cite_type: string;
  cite_format?: string;
  editions: Record<string, EditionData>;
  variations: Record<string, string>;
  examples?: string[];
  publisher?: string;
  notes?: string;
  href?: string;
  [key: string]: unknown;
}

export type Reporters = Record<string, ReporterData[]>;

export interface LawData {
  name: string;
  regexes: string[];
  examples: string[];
  variations: string[];
  start: Date | null;
  end: Date | null;
  [key: string]: unknown;
}

export type Laws = Record<string, LawData[]>;

export interface JournalData {
  name: string;
  regexes?: string[];
  examples?: string[];
  start: Date | null;
  end: Date | null;
  [key: string]: unknown;
}

export type Journals = Record<string, JournalData[]>;

export type StateAbbreviations = Record<string, string>;
export type CaseNameAbbreviations = Record<string, string>;
export type RegexVariables = Record<string, string>;
export type VariationsOnly = Record<string, string[]>;
export type Editions = Record<string, string>;
export type NamesToEditions = Record<string, string[]>;
export type SpecialFormats = Record<string, string>;
