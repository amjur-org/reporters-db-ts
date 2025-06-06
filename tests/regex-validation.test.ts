import { describe, it, expect, beforeAll } from 'vitest';
import { REPORTERS, REGEX_VARIABLES } from '../src/index';
import { recursiveSubstitute, substituteEditions } from '../src/utils';
import createPCREModule, { type EmscriptenModule } from '@syntropiq/libpcre-ts';

describe('Regex Tests', () => {
  let pcre: EmscriptenModule;
  
  beforeAll(async () => {
    pcre = await createPCREModule();
  });

  /**
   * Check that each regex matches at least one example, and each example matches at least one regex
   */
  const checkRegexes = (regexes: Array<[string, string]>, examples: string[]) => {
    const matchedExamples = new Set<string>();

    // Check that each regex matches at least one example
    for (const [regexTemplate, regex] of regexes) {
      let hasMatch = false;
      for (const example of examples) {
        // Convert Python named groups to PCRE format and anchor the regex at both ends
        const pcrePattern = '^' + regex.replace(/\(\?P<([^>]+)>/g, '(?<$1>') + '$';
        try {
          const compiledRegex = new pcre.PCRERegex(pcrePattern);
          if (compiledRegex.test(example)) {
            hasMatch = true;
            matchedExamples.add(example);
          }
        } catch (error) {
          throw new Error(`Failed to compile regex: ${pcrePattern}. Error: ${error}`);
        }
      }
      if (!hasMatch) {
        throw new Error(
          `No match in 'examples' for custom regex ${regexTemplate}.\n` +
          `Expanded regex: ${regex}.\n` +
          `Provided examples: ${examples.join(', ')}`
        );
      }
    }

    // Check that each example is matched by at least one regex
    const unmatchedExamples = examples.filter(ex => !matchedExamples.has(ex));
    if (unmatchedExamples.length > 0) {
      throw new Error(
        `Not all examples matched. Unmatched examples: ${unmatchedExamples.join(', ')}`
      );
    }
  };

  /**
   * Check that each regex has named <reporter> and <page> matching groups
   */
  const checkForMatchingGroups = (regexes: Array<[string, string]>, examples: string[]) => {
    for (const [, regex] of regexes) {
      for (const example of examples) {
        // Convert Python named groups to PCRE format and anchor the regex at both ends
        const pcrePattern = '^' + regex.replace(/\(\?P<([^>]+)>/g, '(?<$1>') + '$';
        try {
          const compiledRegex = new pcre.PCRERegex(pcrePattern);
          const match = compiledRegex.exec(example);
          if (match) {
            const namedGroups = compiledRegex.getNamedGroups();
            expect(namedGroups).toHaveProperty('reporter');
            expect(namedGroups).toHaveProperty('page');
            break; // Found a match, move to next regex
          }
        } catch (error) {
          throw new Error(`Failed to compile regex: ${pcrePattern}. Error: ${error}`);
        }
      }
    }
  };

  it('should have working regexes for reporters with examples', () => {
    let testedCount = 0;
    
    for (const [reporterAbbv, reporterList] of Object.entries(REPORTERS)) {
      for (const reporterData of reporterList) {
        const examples = reporterData.examples || [];
        if (examples.length === 0) continue;

        const regexes: Array<[string, string]> = [];
        
        for (const [editionAbbv, edition] of Object.entries(reporterData.editions)) {
          if (!edition.regexes) continue;
          
          for (const regexTemplate of edition.regexes) {
            // Get edition strings (main edition + variations)
            const editionStrings = [editionAbbv];
            for (const [variation, target] of Object.entries(reporterData.variations)) {
              if (target === editionAbbv) {
                editionStrings.push(variation);
              }
            }
            
            // Substitute variables and edition placeholder
            let regex = recursiveSubstitute(regexTemplate, REGEX_VARIABLES);
            const regexArray = substituteEditions(regex, editionAbbv, reporterData.variations);
            
            // Take the first substituted regex (there may be multiple)
            if (regexArray.length > 0) {
              regexes.push([regexTemplate, regexArray[0]]);
            }
          }
        }

        if (regexes.length === 0) continue;

        // Test regex matching
        expect(() => {
          checkRegexes(regexes, examples);
        }).not.toThrow();

        // Test matching groups
        expect(() => {
          checkForMatchingGroups(regexes, examples);
        }).not.toThrow();

        testedCount++;
      }
    }

    expect(testedCount).toBeGreaterThan(0);
  });
});
