# Changelog

## [1.1.1] - 2025-05-30

### Fixed
- Fixed dependency reference to use proper npm package version instead of local file path

## [1.1.0] - 2025-05-30

### Changed
- **BREAKING**: Refactored to use `@syntropiq/xtrax` package for common PCRE and regex utilities
- Moved `@syntropiq/libpcre-ts` from direct dependency to peer dependency
- Removed duplicate code for PCRE compilation, regex utilities, and pattern matching functions
- All functionality remains the same, but now leverages shared utilities from the xtrax package

### Technical Details
- Replaced local implementations of `compileRegex`, `escapeRegex`, `substituteEdition`, `substituteEditions`, `getPCREPatternFromData`, and `convertNamedGroups` with imports from `@syntropiq/xtrax/pcre-utils`
- This change reduces code duplication between reporters-db-ts and courts-db-ts projects
- API remains fully backward compatible

### Dependencies
- Added: `@syntropiq/xtrax: ^1.0.0`
- Moved: `@syntropiq/libpcre-ts: ^1.0.0` to peerDependencies

## [1.0.0] - Previous Release
- Initial stable release
