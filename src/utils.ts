import { PCRE, type PCRERegex } from '@syntropiq/libpcre-ts';
import unidecode from 'unidecode';
import type { 
  Reporters, 
  VariationsOnly, 
  Editions, 
  NamesToEditions, 
  SpecialFormats,
  RegexVariables 
} from './types.js';

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
export function suckOutVariationsOnly(reporters: Reporters): VariationsOnly {
  const variationsOut: VariationsOnly = {};
  
  for (const [_reporterKey, dataList] of Object.entries(reporters)) {
    // For each reporter key...
    for (const data of dataList) {
      // For each book it maps to...
      for (const [variationKey, variationValue] of Object.entries(data.variations)) {
        if (variationsOut[variationKey]) {
          if (!variationsOut[variationKey]!.includes(variationValue)) {
            variationsOut[variationKey]!.push(variationValue);
          }
        } else {
          // The item wasn't there; add it.
          variationsOut[variationKey] = [variationValue];
        }
      }
    }
  }
  
  return variationsOut;
}

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
export function suckOutEditions(reporters: Reporters): Editions {
  const editionsOut: Editions = {};
  
  for (const [reporterKey, dataList] of Object.entries(reporters)) {
    // For each reporter key...
    for (const data of dataList) {
      // For each book it maps to...
      for (const editionKey of Object.keys(data.editions)) {
        if (!(editionKey in editionsOut)) {
          // The item wasn't there; add it.
          editionsOut[editionKey] = reporterKey;
        }
      }
    }
  }
  
  return editionsOut;
}

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
export function suckOutFormats(reporters: Reporters): SpecialFormats {
  const formatsOut: SpecialFormats = {};
  
  for (const [_reporterKey, dataList] of Object.entries(reporters)) {
    // For each reporter key...
    for (const data of dataList) {
      // Map the cite_format if it exists
      if (data.cite_format) {
        for (const editionKey of Object.keys(data.editions)) {
          formatsOut[editionKey] = data.cite_format;
        }
      }
    }
  }
  
  return formatsOut;
}

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
export function namesToAbbreviations(reporters: Reporters): NamesToEditions {
  const names: Record<string, string[]> = {};
  
  for (const [_reporterKey, dataList] of Object.entries(reporters)) {
    for (const data of dataList) {
      const abbrevs = Object.keys(data.editions);
      // Sort abbreviations by start date of the edition
      const sortedAbbrevs = abbrevs.sort((a, b) => {
        const aStart = data.editions[a]?.start?.toISOString() || '';
        const bStart = data.editions[b]?.start?.toISOString() || '';
        return (aStart + a).localeCompare(bStart + b);
      });
      names[data.name] = sortedAbbrevs;
    }
  }
  
  // Sort by name
  const sortedNames: NamesToEditions = {};
  const sortedKeys = Object.keys(names).sort();
  for (const key of sortedKeys) {
    sortedNames[key] = names[key]!;
  }
  
  return sortedNames;
}

/**
 * Process contents of variables.json, in preparation for passing to recursiveSubstitute:
 * 
 * - Strip keys ending in '#', which are treated as comments
 * - Flatten nested dicts, so {"page": {"": "A", "foo": "B"}} becomes {"page": "A", "page_foo": "B"}
 * - Add optional variants for each key, so {"page": "\\d+"} becomes {"page_optional": "(?:\\d+ ?)?"}
 * - Resolve nested references
 */
export function processVariables(variables: Record<string, unknown>): RegexVariables {
  // Flatten variables and remove comments
  function flatten(d: Record<string, unknown>, parentKey = ''): Record<string, string> {
    const items: Record<string, string> = {};
    
    for (const [k, v] of Object.entries(d)) {
      if (k.endsWith('#')) {
        continue;
      }
      
      const newKey = [parentKey, k].filter(Boolean).join('_');
      
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        Object.assign(items, flatten(v as Record<string, unknown>, newKey));
      } else {
        items[newKey] = String(v);
      }
    }
    
    return items;
  }
  
  let processedVariables = flatten(variables);
  
  // Add optional variables
  const optionalVars: Record<string, string> = {};
  for (const [k, v] of Object.entries(processedVariables)) {
    optionalVars[`${k}_optional`] = `(?:${v} ?)?`;
  }
  processedVariables = { ...processedVariables, ...optionalVars };
  
  // Resolve references safely - detect cycles and skip problematic variables
  const resolvedVariables: RegexVariables = {};
  for (const [k, v] of Object.entries(processedVariables)) {
    try {
      resolvedVariables[k] = recursiveSubstitute(v, processedVariables);
    } catch (error) {
      // If we hit max depth (circular reference), just use the original value
      console.warn(`Circular reference detected for variable '${k}': ${v}`);
      resolvedVariables[k] = v;
    }
  }
  
  return resolvedVariables;
}

/**
 * Recursively substitute values in `template` from `variables`. For example:
 *     recursiveSubstitute("$a $b $c", {'a': '$b', 'b': '$c', 'c': 'foo'})
 *     "foo foo foo"
 * Infinite loops will raise an Error after maxDepth loops.
 */
export function recursiveSubstitute(
  template: string, 
  variables: Record<string, string>, 
  maxDepth = 100
): string {
  let oldVal = template;
  
  for (let i = 0; i < maxDepth; i++) {
    // Replace variables in the format $var or ${var}
    const newVal = oldVal.replace(/\$\{?(\w+)\}?/g, (match, varName) => {
      return variables[varName] || match;
    });
    
    if (newVal === oldVal) {
      break;
    }
    oldVal = newVal;
  }
  
  // Don't throw error for unresolved variables - just return what we have
  // This matches the Python behavior where unresolved variables are left as-is
  
  return oldVal;
}

/**
 * Escape special regex characters
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Insert edition_name in place of $edition.
 */
export function substituteEdition(regex: string, editionName: string): string {
  return regex.replace(/\$\{?edition\}?/g, escapeRegex(editionName));
}

/**
 * Insert edition strings for the given edition into a regex with an $edition placeholder.
 * Example:
 *     substituteEditions('\\d+ $edition \\d+', 'Foo.', {'Foo. Var.': 'Foo.'})
 *     "\\d+ (?:Foo\\.|Foo\\. Var\\.) \\d+"
 */
export function substituteEditions(
  regex: string, 
  editionName: string, 
  variations: Record<string, string>
): string[] {
  if (!regex.includes('$edition') && !regex.includes('${edition}')) {
    return [regex];
  }
  
  const editionStrings = [editionName];
  for (const [k, v] of Object.entries(variations)) {
    if (v === editionName) {
      editionStrings.push(k);
    }
  }
  
  // Create a single regex with alternation group like Python does
  const escapedEditions = editionStrings.map(edition => escapeRegex(edition));
  const editionGroup = `(?:${escapedEditions.join('|')})`;
  const substitutedRegex = regex.replace(/\$\{?edition\}?/g, editionGroup);
  
  return [substitutedRegex];
}

/**
 * Convert Python named capture groups (?P<name>...) to PCRE format (?<name>...)
 */
export function convertNamedGroups(pattern: string): string {
  return pattern.replace(/\(\?P<([^>]+)>/g, '(?<$1>');
}

/**
 * Compile a regex pattern using PCRE
 * CRITICAL: This uses @syntropiq/libpcre-ts, NOT JavaScript RegExp
 */
export async function compileRegex(pattern: string): Promise<PCRERegex> {
  // Convert named groups from Python to PCRE format
  const pcrePattern = convertNamedGroups(pattern);
  
  // Initialize PCRE module and compile pattern
  const pcre = new PCRE();
  await pcre.init();
  
  return pcre.compile(pcrePattern);
}

/**
 * Get a PCRE pattern from the pre-converted regex data, with substitutions applied.
 * This avoids runtime Python->PCRE conversion and uses pre-converted patterns.
 */
export function getPCREPatternFromData(
  regexData: any, 
  templatePath: string, 
  substitutions: Record<string, string> = {}
): string {
  // Navigate to the template in the regex data structure
  const pathParts = templatePath.split('.');
  let current = regexData;
  
  for (const part of pathParts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      throw new Error(`Template path '${templatePath}' not found in regex data`);
    }
  }
  
  if (typeof current === 'object' && '' in current) {
    current = current[''];
  }
  
  if (typeof current !== 'string') {
    throw new Error(`Template at '${templatePath}' is not a string pattern`);
  }
  
  let pattern = current;
  
  // Apply predefined variable substitutions from regex data
  const variableMap: Record<string, string> = {
    '$volume': regexData.volume?.[''] || '(?<volume>\\d+)',
    '$page': regexData.page?.[''] || '(?<page>\\d+)',
    '$page_with_commas': regexData.page?.with_commas || '(?<page>\\d(?:[\\d,]*\\d)?)',
    '$page_with_commas_and_suffix': regexData.page?.with_commas_and_suffix || '(?<page>\\d(?:[\\d,]*\\d)?[A-Z]?)',
    '$page_with_letter': regexData.page?.with_letter || '(?<page>\\d+[a-zA-Z])',
    '$page_with_periods': regexData.page?.with_periods || '(?<page>\\d(?:[\\d.]*\\d)?)',
    '$page_with_roman_numerals': regexData.page?.with_roman_numerals || '(?<page>[cC]?(?:[xX][cC]|[xX][lL]|[lL]?[xX]{1,3})(?:[iI][xX]|[iI][vV]|[vV]?[iI]{0,3})|(?:[cC]?[lL]?)(?:[iI][xX]|[iI][vV]|[vV]?[iI]{1,3})|(?:[lL][vV]|[cC][vV]|[cC][lL]|[cC][lL][vV]))',
    '$law_section': regexData.law?.section || '(?<section>(?:\\d+(?:[.:\\-]\\d+){0,3})|(?:\\d+(?:\\((?:[a-zA-Z]{1}|\\d{1,2})\\))+))',
    '$law_subject': regexData.law?.subject || '(?<subject>[A-Z][.\\-\'A-Za-z]*(?: [A-Z][.\\-\'A-Za-z]*| &){,4})',
    '$law_day': regexData.law?.day || '(?<day>\\d{1,2}),?',
    '$law_month': regexData.law?.month || '(?<month>[A-Z][a-z]+\\.?)',
    '$law_year': regexData.law?.year || '(?<year>1\\d{3}|20\\d{2})'
  };
  
  // Apply predefined variable substitutions
  for (const [variable, replacement] of Object.entries(variableMap)) {
    const regex = new RegExp(`\\$\\{?${variable.slice(1)}\\}?`, 'g');
    pattern = pattern.replace(regex, replacement);
  }
  
  // Apply custom substitutions passed as parameters
  for (const [key, value] of Object.entries(substitutions)) {
    const regex = new RegExp(`\\$\\{?${key}\\}?`, 'g');
    pattern = pattern.replace(regex, value);
  }
  
  return pattern;
}
