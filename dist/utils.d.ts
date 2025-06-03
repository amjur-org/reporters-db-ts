import { PCREUtils, TemplateEngine } from '@syntropiq/xtrax';
declare const escapeRegex: typeof PCREUtils.escapeRegex, substituteEdition: typeof PCREUtils.substituteEdition, substituteEditions: typeof PCREUtils.substituteEditions, getPCREPatternFromData: typeof PCREUtils.getPCREPatternFromData, convertNamedGroups: typeof PCREUtils.convertNamedGroups;
declare const processVariables: typeof TemplateEngine.processVariables, recursiveSubstitute: typeof TemplateEngine.recursiveSubstitute;
import type { Reporters, VariationsOnly, Editions, NamesToEditions, SpecialFormats } from './types.js';
export { escapeRegex, substituteEdition, substituteEditions, getPCREPatternFromData, convertNamedGroups, processVariables, recursiveSubstitute };
/**
 * Builds a dictionary of variations to canonical reporters.
 *
 * The dictionary takes the form of:
 *     {
 *      "A. 2d": ["A.2d"],
 *      ...
 *      "P.R.": ["Pen. & W.", "P.R.R.", "P."],
 *     }
 *
 * In other words, it's a dictionary that maps each variation to a list of
 * reporters that it could be possibly referring to.
 */
export declare function suckOutVariationsOnly(reporters: Reporters): VariationsOnly;
/**
 * Builds a dictionary mapping edition keys to their root name.
 *
 * The dictionary takes the form of:
 *     {
 *      "A.":   "A.",
 *      "A.2d": "A.",
 *      "A.3d": "A.",
 *      "A.D.": "A.D.",
 *      ...
 *     }
 *
 * In other words, this lets you go from an edition match to its parent key.
 */
export declare function suckOutEditions(reporters: Reporters): Editions;
/**
 * Builds a dictionary mapping edition keys to their cite_format if any.
 *
 * The dictionary takes the form of:
 *     {
 *         'T.C. Summary Opinion': '{reporter} {volume}-{page}',
 *         'T.C. Memo.': '{reporter} {volume}-{page}'
 *         ...
 *     }
 *
 * In other words, this lets you go from an edition match to its parent key.
 */
export declare function suckOutFormats(reporters: Reporters): SpecialFormats;
/**
 * Build a dict mapping names to their variations
 *
 * Something like:
 *
 *     {
 *         "Atlantic Reporter": ['A.', 'A.2d'],
 *     }
 *
 * Note that the abbreviations are sorted by start date.
 */
export declare function namesToAbbreviations(reporters: Reporters): NamesToEditions;
//# sourceMappingURL=utils.d.ts.map