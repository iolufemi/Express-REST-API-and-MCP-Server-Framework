# Security and Deprecated Package Updates

## Current state (zero vulnerabilities)

### Summary
- **Full tree**: `npm audit` reports **0 vulnerabilities**.
- **Production**: `npm audit --omit=dev` reports **0 vulnerabilities**.

This was achieved by applying `package.json` overrides for transitive dependencies, upgrading or replacing vulnerable direct dependencies, and removing packages that depended on unfixable vulnerable code (e.g. `lodash.template`).

---

## Changes applied

### 1. Overrides (transitive dependencies)

The following overrides in `package.json` force safer versions across the dependency tree:

| Package | Override | Reason |
|--------|----------|--------|
| **minimist** | `^1.2.6` | Prototype pollution |
| **lodash** | `^4.17.23` | Prototype pollution |
| **fsevents** | `^2.3.3` | Build/safety |
| **tar** | `^7.5.8` | Arbitrary file overwrite |
| **minimatch** | `^10.2.1` | ReDoS |
| **rimraf** | `^6.0.0` | Safer glob |
| **semver** | `^7.5.2` | ReDoS / correctness |
| **dot-prop** | `^9.0.0` | Prototype pollution |
| **trim-newlines** | `^3.0.1` | ReDoS |
| **braces** | `^3.0.3` | ReDoS |
| **semver-regex** | `^3.1.4` | ReDoS |
| **node-gyp** | `^12.0.0` | Build toolchain (glob/tar) |
| **node-loggly-bulk** | `axios`: `1.13.5` | SSRF, DoS, mergeConfig in axios; applies to winston-loggly-bulk’s dependency |
| **diff** | `^5.2.0` | ReDoS |
| **js-yaml** | `^3.14.2` | Code execution |
| **micromatch** | `^4.0.8` | ReDoS |
| **tmp** | `^0.2.4` | Symlink / race |
| **got** | `^11.8.5` | SSRF / auth leak (from conventional-changelog-cli tree) |
| **http-cache-semantics** | `^4.1.1` | ReDoS |
| **@conventional-changelog/git-client** | `^2.0.0` | Safer git client in changelog-cli tree |
| **gulp-mocha** (nested) | `debug`, `diff`, `js-yaml` | Safe versions under gulp-mocha only |

The **node-loggly-bulk** override is critical for eliminating the three high-severity axios advisories; it must be at the `node-loggly-bulk` level (not nested under `winston-loggly-bulk`) so npm applies it to every occurrence in the tree.

### 2. Changelog: conventional-changelog-cli

- **Removed**: `gulp-conventional-changelog` (pulled in conventional-changelog 1.x/3.x → vulnerable `lodash.template`; all versions of lodash.template are vulnerable with no fix).
- **Added**: `conventional-changelog-cli@^5.0.0` (uses conventional-changelog 6.x, no lodash.template).
- **Gulp**: The `changelog` task now runs `npx conventional-changelog -p angular -i CHANGELOG.md -s` via `execSync`. Behavior is unchanged (angular preset, in-place CHANGELOG update).

### 3. GitHub release: @octokit/rest

- **Removed**: `conventional-github-releaser` (depended on conventional-changelog 1.x/3.x → lodash.template; no safe version).
- **Added**: `@octokit/rest@^21.0.2` and **`scripts/github-release.mjs`**, which:
  - Reads `package.json` for version and `repository.url` (owner/repo).
  - Reads the current version’s section from `CHANGELOG.md` and uses it as the release body.
  - Creates the release with `Octokit.rest.repos.createRelease()`.
- **Token**: Same environment variables as before: `GITHUB_TOKEN`, `GIT_OAUTH_TOKEN`, or `CONVENTIONAL_GITHUB_RELEASER_TOKEN`.
- **Gulp**: The `github-release` task runs `node scripts/github-release.mjs` instead of the old releaser. The `release` flow (bump → changelog → commit → push → tag → github-release) is unchanged.

### 4. Tests: remove deprecated `q`

- **Removed**: Use of the `q` promise library in tests and generated templates. It was only present as a transitive dependency of `conventional-github-releaser`; removing that package removed `q` from the tree.
- **Replaced**: `q.Promise(...)` with native `new Promise(...)` in:
  - `test/models/validates.test.ts` (and the same pattern in generated tests from)
  - `template/model_test.tmpl`
  - `template/model_sql_test.tmpl`
  - `template/model_api_test.tmpl`
- No new dependency; behavior is unchanged.

### 5. Direct dependency (unchanged for security)

- **axios**: `^1.13.0` (or `^1.13.5`) — project uses a safe version; the remaining risk was only in `winston-loggly-bulk` → `node-loggly-bulk` → axios, fixed by the override above.

---

## Clean install (recommended after override changes)

To ensure overrides (especially **node-loggly-bulk** → axios) are applied, use a clean install when you change them:

```bash
rm -rf node_modules package-lock.json && npm install
```

In CI and production, `npm ci` (with the committed lockfile) keeps the overridden tree.

---

## Verifying audits

```bash
npm audit              # full dependency tree
npm audit --omit=dev   # production dependencies only
npm audit fix          # apply safe fixes only
npm audit fix --force  # may introduce breaking changes; review first
```

---

## Earlier updates (reference)

- **lodash**: `^4.17.21` → `^4.17.23` (prototype pollution).
- **winston-loggly-bulk**: `^2.0.2` → `^3.3.3` (drops vulnerable request/form-data chain).
- **axios**: Bumped to `^1.13.0` (SSRF, DoS, mergeConfig fixes).
- **minimist**: Explicit safe range `^1.2.6`.
- **gulp-util**: Removed (deprecated; vulnerable lodash.template). Replaced in `gulpfile.cjs` with `console.error` for bump task error handling.
- **run-sequence**: Removed (unused; tasks use `gulp.series` only).
- **ESLint / TypeScript-ESLint / c8 / gulp**: Various version bumps for security and compatibility (see git history if needed).
