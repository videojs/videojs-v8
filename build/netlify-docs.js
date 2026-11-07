const sh = require('shelljs');
const semver = require('semver');
const path = require('path');

const GIT_LOG = `git log --format=%B -n 1 ${process.env.COMMIT_REF}`;
const output = sh.exec(GIT_LOG, {async: false, silent: true}).stdout;

// if we're on main branch and not on a tagged commit,
// error the build so it doesn't redeploy the docs
if (process.env.BRANCH === 'main' && semver.valid(output.trim()) === null) {
  process.exit(1);
} else {
  sh.exec('npm run docs:api');

  // the root of the docs site is docs/api, which is not in version control.
  // legacy.videojs.org proxies /api/* to this site, so the API docs are nested
  // under api/ to keep their URLs (and the redirects Netlify adds for them)
  // the same on both sites.
  const docsPath = path.join(__dirname, '..', 'docs');
  const sitePath = path.join(docsPath, 'api');
  const tmpPath = path.join(docsPath, 'api-tmp');

  sh.mv(sitePath, tmpPath);
  sh.mkdir('-p', sitePath);
  sh.mv(tmpPath, path.join(sitePath, 'api'));

  // move docs/_redirects into the root of the docs site
  sh.cp(path.join(docsPath, '_redirects'), path.join(sitePath, '_redirects'));
}
