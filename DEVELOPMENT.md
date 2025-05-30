# reporters-db-ts Development Guide

## Overview

This is a TypeScript port of the Python `reporters-db` library. The original Python library is a clean, dependency-free database of legal court reporters with simple utility functions - making it an ideal candidate for porting.

## 🚨 CRITICAL: PCRE Compatibility

**IMPORTANT**: This project uses `@syntropiq/libpcre-ts` for all regex operations. 

**DO NOT USE JavaScript's built-in RegExp** - it lacks features that the original Python `re` module and PCRE provide.

**USE ONLY**: `@syntropiq/libpcre-ts` for:
- Regex compilation
- Pattern matching  
- Named capture groups
- All regex operations

This is a fresh attempt at porting this project - previous attempts failed by falling into the JavaScript regex rabbit hole. The `@syntropiq/libpcre-ts` library provides full PCRE compatibility via WASM refer to the package's types file for usage.

## Migration Analysis: No Major Hazards Found ✅

After thorough analysis of the Python codebase, there are **no dependency rabbit holes** or hidden complexities:

### ✅ What Makes This Port Clean

1. **Zero External Dependencies**: Only uses Python standard library (`json`, `os`, `datetime`, `re`, `collections`, `string`)
2. **Pure Data + Utilities**: Just JSON files + simple processing functions
3. **No Complex Algorithms**: No ML, no external services, no platform-specific code
4. **No C Extensions**: No `hyperscan`, `pyahocorasick`, or other native dependencies

### ✅ Core Components to Port

The entire library consists of:

1. **JSON Data Files** (already available)
   - `reporters.json` - Court reporter metadata
   - `journals.json` - Legal journal metadata  
   - `regexes.json` - Regex pattern templates
   - `laws.json` - Legal statute patterns
   - `case_name_abbreviations.json` - Standardized abbreviations
   - `state_abbreviations.json` - State abbreviations

2. **Simple Utility Functions** (`utils.py`)
   - Template substitution system
   - Data extraction helpers
   - Regex processing functions

3. **Data Loading** (`__init__.py`)
   - JSON file loading with date parsing
   - Data structure initialization

## Implementation Strategy

### Phase 1: Direct Port (1-2 days)

#### 1.1 Setup Project Structure
```
reporters-db-ts/
├── src/
│   ├── index.ts              # Main exports
│   ├── utils.ts              # Port of utils.py functions
│   ├── types.ts              # TypeScript type definitions
│   └── data/                 # JSON data files
│       ├── reporters.json
│       ├── journals.json
│       ├── regexes.json
│       ├── laws.json
│       ├── case_name_abbreviations.json
│       └── state_abbreviations.json
├── tests/
│   └── utils.test.ts         # Unit tests
├── package.json
├── tsconfig.json
└── README.md
```

#### 1.2 Install Dependencies
```bash
npm install @syntropiq/libpcre-ts
npm install --save-dev typescript @types/node vitest
```

**REMINDER**: All regex operations MUST use `@syntropiq/libpcre-ts`, not JavaScript RegExp.

#### 1.3 Port Core Functions

##### Template Substitution System (Medium Complexity)
Port the recursive template variable substitution:

```python
# Python original
def recursive_substitute(template, variables, max_depth=100):
    """Recursively substitute values in template from variables"""
```

This handles `$volume`, `$reporter`, `$page` placeholders in regex patterns.

##### Data Extraction Functions (Low Complexity)
```python
# Python originals to port:
def suck_out_variations_only(reporters)   # Maps variations to canonical names
def suck_out_editions(reporters)          # Maps editions to parent keys  
def names_to_abbreviations(reporters)     # Maps full names to abbreviations
def suck_out_formats(reporters)           # Maps editions to cite formats
```

##### Edition Processing (Low Complexity)
```python
def substitute_editions(regex, edition_name, variations)
# Builds regex alternatives like: (?:Foo\.|Foo\. Var\.)
```

### Phase 2: PCRE Integration (1 day)

#### 2.1 Named Capture Group Conversion
Convert Python named groups to PCRE format:
- **Python**: `(?P<name>...)`  
- **PCRE**: `(?<name>...)`

**CRITICAL**: Use `@syntropiq/libpcre-ts` for this conversion, NOT JavaScript RegExp.

#### 2.2 Regex Template Processing
Implement template substitution using `@syntropiq/libpcre-ts`:

```typescript
import { PCRE } from '@syntropiq/libpcre-ts';

function compileRegex(pattern: string): PCRE {
  // Convert named groups: (?P<name>...) → (?<name>...)
  const pcrePattern = pattern.replace(/\(\?P<([^>]+)>/g, '(?<$1>');
  
  // Compile with @syntropiq/libpcre-ts - NOT JavaScript RegExp
  return new PCRE(pcrePattern);
}
```

#### 2.3 Test Against Original Data
Verify that processed regexes work with existing JSON test cases.

### Phase 3: API Compatibility (1 day)

#### 3.1 Maintain Python API Surface
Ensure TypeScript exports match Python module structure:

```typescript
// Match Python exports
export {
  REPORTERS,
  JOURNALS, 
  LAWS,
  REGEX_VARIABLES,
  VARIATIONS_ONLY,
  EDITIONS,
  NAMES_TO_EDITIONS,
  SPECIAL_FORMATS
};
```

#### 3.2 Date Handling
Replace Python's `datetime.strptime()` with JavaScript Date parsing:

```python
# Python original
datetime.datetime.strptime(v, "%Y-%m-%dT%H:%M:%S")
```

```typescript
// TypeScript equivalent  
new Date(v)  // ISO format is natively supported
```

## Key Implementation Details

### Template Substitution Algorithm

The core complexity is the recursive template substitution system:

```typescript
function recursiveSubstitute(
  template: string, 
  variables: Record<string, string>, 
  maxDepth = 100
): string {
  let oldVal = template;
  for (let i = 0; i < maxDepth; i++) {
    const newVal = oldVal.replace(/\$\{?(\w+)\}?/g, (match, varName) => 
      variables[varName] || match
    );
    if (newVal === oldVal) break;
    oldVal = newVal;
  }
  if (oldVal !== template && oldVal.includes('$')) {
    throw new Error(`Max depth exceeded for template '${template}'`);
  }
  return oldVal;
}
```

### Regex Escaping

Replace Python's `re.escape()`:

```typescript
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
```

### Edition Substitution

```typescript
function substituteEditions(
  regex: string, 
  editionName: string, 
  variations: Record<string, string>
): string[] {
  if (!regex.includes('$edition')) {
    return [regex];
  }
  
  const editionStrings = [editionName];
  for (const [variant, canonical] of Object.entries(variations)) {
    if (canonical === editionName) {
      editionStrings.push(variant);
    }
  }
  
  return editionStrings.map(edition => 
    regex.replace(/\$\{?edition\}?/g, escapeRegex(edition))
  );
}
```

## Testing Strategy

### Unit Tests
Port existing Python tests to verify:
1. Template substitution works correctly
2. Data extraction functions produce expected output  
3. Regex patterns compile successfully with `@syntropiq/libpcre-ts`
4. Named capture groups are properly converted

### Integration Tests
1. Load all JSON data files
2. Process all regex templates  
3. Verify all patterns compile with `@syntropiq/libpcre-ts` (NOT JavaScript RegExp)
4. Test against known citation examples

## Dependencies

### Runtime Dependencies
- `@syntropiq/libpcre-ts` - **REQUIRED** for PCRE regex compatibility

### Development Dependencies  
- `typescript` - TypeScript compiler
- `@types/node` - Node.js type definitions
- `vitest` - Testing framework

## Important Reminders

### 🚨 PCRE Usage - DO NOT FORGET

1. **ALL regex operations** must use `@syntropiq/libpcre-ts`
2. **NEVER use JavaScript RegExp** for pattern matching
3. **This is attempt #5** - previous attempts failed by using JavaScript regex
4. **The `@syntropiq/libpcre-ts` library** provides full PCRE compatibility via WASM
5. **Named capture groups** need conversion from Python to PCRE syntax

### Why This Port Will Succeed

Unlike previous attempts, this analysis found:
- ✅ **No hidden dependencies** or external services
- ✅ **No complex algorithms** or platform-specific code  
- ✅ **No C extensions** or native binary requirements
- ✅ **Clean data structures** that port directly to TypeScript
- ✅ **Simple utility functions** with clear input/output contracts
- ✅ **Proper PCRE support** via `@syntropiq/libpcre-ts`

The original Python library is essentially just:
1. JSON data files (already have these)
2. Template substitution system (straightforward algorithm)  
3. Data extraction helpers (simple dictionary operations)
4. Date parsing (native JavaScript Date support)

**No rabbit holes. No surprises. Clean port.**

## Success Criteria

1. ✅ All JSON data loads correctly
2. ✅ All regex templates process without errors using `@syntropiq/libpcre-ts`
3. ✅ Named capture groups convert properly to PCRE format
4. ✅ Template substitution produces identical output to Python version
5. ✅ All utility functions return expected data structures
6. ✅ Integration with `@syntropiq/libpcre-ts` works correctly
7. ✅ No usage of JavaScript's built-in RegExp anywhere in codebase

## Getting Started

1. **Initialize the project**:
   ```bash
   cd /home/username/Projects/amjur.org/reporters-db-ts
   npm init -y
   npm install @syntropiq/libpcre-ts
   npm install --save-dev typescript @types/node vitest
   ```

2. **Copy JSON data files** from original Python project

3. **Start with template substitution system** - this is the core complexity

4. **Remember**: Use `@syntropiq/libpcre-ts` for ALL regex operations

5. **Test early and often** with real data from the JSON files
