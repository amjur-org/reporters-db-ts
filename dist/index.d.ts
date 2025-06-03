import type { Reporters, Laws, Journals, StateAbbreviations, CaseNameAbbreviations, RegexVariables, VariationsOnly, Editions, NamesToEditions, SpecialFormats } from './types.js';
export declare const REPORTERS: Reporters;
export declare const STATE_ABBREVIATIONS: StateAbbreviations;
export declare const CASE_NAME_ABBREVIATIONS: CaseNameAbbreviations;
export declare const LAWS: Laws;
export declare const JOURNALS: Journals;
export declare const REGEX_VARIABLES: RegexVariables;
export declare const VARIATIONS_ONLY: VariationsOnly;
export declare const EDITIONS: Editions;
export declare const NAMES_TO_EDITIONS: NamesToEditions;
export declare const SPECIAL_FORMATS: SpecialFormats;
export { suckOutVariationsOnly, suckOutEditions, suckOutFormats, namesToAbbreviations, processVariables, recursiveSubstitute, escapeRegex, substituteEdition, substituteEditions, convertNamedGroups, getPCREPatternFromData } from './utils.js';
export { compileRegex } from './compileRegex.js';
export type { Reporters, Laws, Journals, StateAbbreviations, CaseNameAbbreviations, RegexVariables, VariationsOnly, Editions, NamesToEditions, SpecialFormats, ReporterData, LawData, JournalData, EditionData } from './types.js';
export declare const PCRE_REGEX_DATA: {
    full_cite: {
        "": string;
        "#": string;
        cch: string;
        "cch#": string;
        format_neutral: {
            "": string;
            "#": string;
            "3_4": string;
            "3_4#": string;
        };
        illinois_neutral: {
            "": string;
            "#": string;
        };
        louisiana: {
            "": string;
            "#": string;
        };
        paragraph: {
            "": string;
            "#": string;
            with_suffix: string;
            "with_suffix#": string;
        };
        single_volume: string;
        year_included: {
            "": string;
            "#": string;
        };
        year_page: string;
    };
    law: {
        "#": string;
        day: string;
        month: string;
        section: string;
        "section#": string;
        subject: string;
        "subject#": string;
        subject_word: string;
        "subject_word#": string;
        year: string;
    };
    page: {
        "": string;
        "#": string;
        "3_4": string;
        "3_4#": string;
        with_commas: string;
        "with_commas#": string;
        with_commas_and_suffix: string;
        "with_commas_and_suffix#": string;
        with_commas_or_periods: string;
        "with_commas_or_periods#": string;
        with_letter: string;
        "with_letter#": string;
        with_periods: string;
        "with_periods#": string;
        with_roman_numerals: string;
        "with_roman_numerals#": string;
    };
    paragraph_marker: string;
    reporter: {
        "": string;
        "#": string;
    };
    section_marker: string;
    volume: {
        "": string;
        "#": string;
        nominative: string;
        "nominative#": string;
        with_alpha_suffix: string;
        "with_alpha_suffix#": string;
        with_digit_suffix: string;
        "with_digit_suffix#": string;
        year: string;
        "year#": string;
    };
};
//# sourceMappingURL=index.d.ts.map