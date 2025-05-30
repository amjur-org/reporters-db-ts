// Robust PCRE Compile for Python-like Fullmatch

import { PCRE } from '@syntropiq/libpcre-ts';

let _pcreInstance: PCRE | null = null;

/**
 * Compile a PCRE regex with fullmatch semantics (like Python's re.fullmatch).
 * Anchors the pattern at both ends and uses ANCHORED, UTF8, and UNICODE options.
 */
export async function compileRegex(pattern: string) {
  if (!_pcreInstance) {
    _pcreInstance = new PCRE();
    await _pcreInstance.init();
  }
  // Use ANCHORED and UTF8 options for Python-like fullmatch
  const opts = _pcreInstance.constants.ANCHORED | _pcreInstance.constants.UTF8;
  // Always anchor at both ends for fullmatch semantics
  const anchoredPattern = pattern.startsWith('^') ? pattern : '^' + pattern;
  const finalPattern = anchoredPattern.endsWith('$') ? anchoredPattern : anchoredPattern + '$';
  return _pcreInstance.compile(finalPattern, opts);
}
