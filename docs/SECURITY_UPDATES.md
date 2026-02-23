# Security and Deprecated Package Updates

## Changes applied

### Direct dependency updates
- **lodash**: `^4.17.21` → `^4.17.23` (prototype pollution fix)
- **winston-loggly-bulk**: `^2.0.2` → `^3.3.3` (drops vulnerable `request`/`form-data`/`qs`/`tough-cookie` chain)
- **axios**: `^1.7.7` → `^1.8.2` (SSRF and DoS fixes)
- **minimist**: `^1.2.8` → `^1.2.6` (explicit safe range; 1.2.6+ fixes prototype pollution)

### Removed
- **gulp-util**: Removed (deprecated; contained vulnerable `lodash.template`). Replaced its only use in `gulpfile.cjs` with `console.error` for bump task error handling.

### npm overrides (transitive dependencies)
- **minimist**: `^1.2.6` (ensures all nested uses get a safe version)
- **lodash**: `^4.17.23`
- **fsevents**: `^2.3.3` (replaces deprecated/insecure v1 where used)

### Result
- **Before**: 88 vulnerabilities (9 low, 14 moderate, 62 high, 3 critical)
- **After**: 72 vulnerabilities (6 low, 9 moderate, 57 high, 0 critical)

Critical issues are cleared. Remaining vulnerabilities are mostly in **dev-only** dependency trees (e.g. ESLint, Gulp, Mocha, conventional-changelog). They do not affect production runtime unless you run those tools on untrusted input.

## Remaining vulnerabilities (optional follow-ups)

- **ESLint** (and gulp-eslint): ajv, minimatch, inquirer, table, etc. Fix would require upgrading to ESLint 10 (breaking).
- **Gulp** (and gulp-nodemon, glob-watcher, chokidar): braces, micromatch, etc. Fix would require upgrading to Gulp 5 (breaking).
- **conventional-github-releaser / gulp-conventional-changelog**: dot-prop, semver-regex, trim-newlines, meow. Used only for release/changelog; consider upgrading or replacing with `release-please` or similar.

To re-check at any time:
```bash
npm audit
npm audit fix          # safe fixes only
npm audit fix --force  # may introduce breaking changes
```
