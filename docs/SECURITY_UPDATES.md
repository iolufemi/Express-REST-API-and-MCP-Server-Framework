# Security and Deprecated Package Updates

## Latest (Zero-Vulnerabilities Plan)

### Summary
- **Production**: `npm audit --omit=dev` reports **0 vulnerabilities**.
- **Full tree**: Remaining vulnerabilities are in **dev-only** dependency trees (gulp-mocha, gulp-eslint, gulp-nodemon, conventional-changelog, etc.). They do not affect production runtime.

### Changes applied

#### Phase 1 – Overrides (transitive)
- **tar**: `^7.5.8`
- **minimatch**: `^10.2.1` (ReDoS fix)
- **rimraf**: `^6.0.0`
- **semver**: `^7.5.2`
- **dot-prop**: `^9.0.0`
- **trim-newlines**: `^3.0.1`
- **braces**: `^3.0.3`
- **semver-regex**: `^3.1.4`
- **node-gyp**: `^12.0.0` (for sqlite3 build toolchain)
- **winston-loggly-bulk** (nested): `node-loggly-bulk` → `axios`: `1.13.5`
- Existing: **minimist**, **lodash**, **fsevents** (unchanged)

#### Phase 2 – Direct dependency upgrades
- **axios**: `^1.8.2` → `^1.13.0` (SSRF, DoS, mergeConfig fixes)
- **sinon**: `^20.0.0` → `^21.0.1` (diff vuln fix)
- **conventional-github-releaser**: `^1.1.12` → `1.1.7` (downgrade for conventional-changelog vulns)

#### Phase 3 – ESLint and TypeScript-ESLint
- **eslint**: `^9.15.0` → `^9.17.0`
- **@typescript-eslint/eslint-plugin**, **@typescript-eslint/parser**: `^8.15.0` → `^8.18.0`
- **eslint.config.js**: `projectService` with `allowDefaultProject` for `src/types/express.d.ts`; `tsconfigRootDir` set

#### Phase 4 – Coverage
- **c8**: `^9.1.0` → `^10.1.3` (test-exclude/glob/minimatch fixes)

#### Phase 5 – Gulp
- **gulp**: `^4.0.2` → `^5.0.1`
- **run-sequence**: Removed (was required but never used; tasks use `gulp.series` only)

#### Phase 6 – winston-loggly-bulk / axios
- Nested override so `winston-loggly-bulk` → `node-loggly-bulk` uses **axios** `1.13.5` (no vulnerable axios in tree when lockfile is installed from scratch).

#### Phase 7 – sqlite3 / node-gyp
- **node-gyp** override `^12.0.0` so sqlite3’s build toolchain uses a safer glob/make-fetch-happen chain. **tar** override (Phase 1) also applies to sqlite3’s install pipeline.

#### Phase 8 – Final
- **minimatch** override updated to `^10.2.1` (ReDoS fix for full and production tree).
- Overrides kept minimal; full regression (build, lint, tests) confirmed.

### Result
- **Before (plan baseline)**: 71 vulnerabilities (57 high, 8 moderate, 6 low).
- **After (full install)**: 26 vulnerabilities (6 high, 12 moderate, 8 low), all in **devDependencies**.
- **Production** (`npm audit --omit=dev`): **0 vulnerabilities**.

### Important note for installs
To ensure overrides (especially `winston-loggly-bulk` → axios) apply, use a clean install when needed:
```bash
rm -rf node_modules package-lock.json && npm install
```
For CI/production, `npm ci` (with the committed lockfile) preserves the overridden tree.

---

## Earlier updates (reference)

### Direct dependency updates (previous)
- **lodash**: `^4.17.21` → `^4.17.23` (prototype pollution fix)
- **winston-loggly-bulk**: `^2.0.2` → `^3.3.3` (drops vulnerable request/form-data chain)
- **axios**: `^1.7.7` → `^1.8.2` (later bumped to ^1.13.0 as above)
- **minimist**: explicit safe range `^1.2.6`

### Removed
- **gulp-util**: Removed (deprecated; vulnerable `lodash.template`). Replaced in `gulpfile.cjs` with `console.error` for bump task error handling.

### Re-check at any time
```bash
npm audit
npm audit --omit=dev   # production deps only
npm audit fix          # safe fixes only
npm audit fix --force  # may introduce breaking changes
```
