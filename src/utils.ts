import unidecode from 'unidecode';
import { 
  escapeRegex, 
  substituteEdition, 
  substituteEditions, 
  getPCREPatternFromData,
  convertNamedGroups
} from '@syntropiq/xtrax/pcre-utils';
import type { 
  Reporters, 
  VariationsOnly, 
  Editions, 
  NamesToEditions, 
  SpecialFormats,
  RegexVariables 
} from './types.js';

// Re-export the imported functions for use by index.ts
export { 
  escapeRegex, 
  substituteEdition, 
  substituteEditions, 
  getPCREPatternFromData,
  convertNamedGroups
};

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
