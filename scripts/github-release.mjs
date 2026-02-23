/**
 * Creates a GitHub release for the current version using CHANGELOG.md body.
 * Replaces conventional-github-releaser to avoid vulnerable lodash.template.
 * Requires: GITHUB_TOKEN, GIT_OAUTH_TOKEN, or CONVENTIONAL_GITHUB_RELEASER_TOKEN.
 */
import { readFileSync } from 'fs';
import { Octokit } from '@octokit/rest';

const token = process.env.GITHUB_TOKEN || process.env.GIT_OAUTH_TOKEN || process.env.CONVENTIONAL_GITHUB_RELEASER_TOKEN;
if (!token) {
    console.error('GitHub token required. Set GITHUB_TOKEN, GIT_OAUTH_TOKEN, or CONVENTIONAL_GITHUB_RELEASER_TOKEN.');
    process.exit(1);
}

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
const version = pkg.version;
const repoUrl = (pkg.repository && (pkg.repository.url || pkg.repository)) || '';
const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?$/);
if (!match) {
    console.error('Could not parse repository from package.json (e.g. "url": "git+https://github.com/owner/repo.git")');
    process.exit(1);
}
const [owner, repo] = [match[1], match[2].replace(/\.git$/, '')];

let body = '';
try {
    const changelog = readFileSync('./CHANGELOG.md', 'utf8');
    const versionHeading = `## [${version}]`;
    const idx = changelog.indexOf(versionHeading);
    if (idx !== -1) {
        const start = idx + versionHeading.length;
        const nextH2 = changelog.indexOf('\n## ', start);
        body = (nextH2 !== -1 ? changelog.slice(start, nextH2) : changelog.slice(start)).trim();
    }
} catch (_) {
    // leave body empty
}

const octokit = new Octokit({ auth: token });
try {
    await octokit.rest.repos.createRelease({
        owner,
        repo,
        tag_name: version,
        name: `v${version}`,
        body: body || `Release ${version}`,
    });
    console.log(`Created release v${version} for ${owner}/${repo}`);
} catch (err) {
    console.error(err.message || err);
    process.exit(1);
}
