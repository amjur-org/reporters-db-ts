const { LAWS, REGEX_VARIABLES } = require('./dist/index.js');
const { recursiveSubstitute } = require('./dist/utils.js');

const law = LAWS['ASBCA'][0];
console.log('Law:', law);
console.log('Regex template:', law.regexes[0]);

// Test substitution
let regex = recursiveSubstitute(law.regexes[0], REGEX_VARIABLES);
console.log('After recursive substitution:', regex);

// Create alternation pattern for all series strings  
const seriesStrings = ['ASBCA', ...law.variations];
console.log('Series strings:', seriesStrings);

const editionPattern = seriesStrings.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
console.log('Edition pattern:', editionPattern);

regex = regex.replace(/\$\{?edition\}?/g, `(?:${editionPattern})`);
console.log('After edition substitution:', regex);

// Convert to PCRE and test
const pcrePattern = '^' + regex.replace(/\(\?P<([^>]+)>/g, '(?<$1>') + '$';
console.log('PCRE pattern:', pcrePattern);
console.log('Example to test:', law.examples[0]);

// Test match
const example = law.examples[0];
console.log('Does pattern match example?');
console.log('Pattern:', pcrePattern);
console.log('Example:', example);
