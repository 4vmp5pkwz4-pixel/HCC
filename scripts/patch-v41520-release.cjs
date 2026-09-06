'use strict';
const fs = require('node:fs');

const VERSION = '4.152.0';
const BUILD = 'unified-atlas-time-2026.09.06.1';

let html = fs.readFileSync('index.html', 'utf8');

function replaceOne(regex, replacement, label) {
  const matches = [...html.matchAll(regex)];
  if (matches.length !== 1) {
    throw new Error(`${label}: expected exactly one match, found ${matches.length}`);
  }
  html = html.replace(regex, replacement);
}

replaceOne(/const HCC_VERSION='[^']+'/g, `const HCC_VERSION='${VERSION}'`, 'HCC_VERSION');
replaceOne(/const HCC_BUILD='[^']+'/g, `const HCC_BUILD='${BUILD}'`, 'HCC_BUILD');
replaceOne(/data-hcc-build="[^"]+"/g, `data-hcc-build="${BUILD}"`, 'data-hcc-build');
replaceOne(/<meta name="hcc-build" content="[^"]+">/g, `<meta name="hcc-build" content="${BUILD}">`, 'hcc-build meta');
replaceOne(/<span class="buildMark">· v[^<]+<\/span>/g, `<span class="buildMark">· v${VERSION}</span>`, 'build mark');

fs.writeFileSync('index.html', html);

const versionPath = 'version.json';
const version = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
version.version = VERSION;
version.build = BUILD;
version.channel = 'github-pages';
version.source = 'main';
version.note = "Served with cache: 'no-store' by the freshness sentinel in index.html. scripts/validate.mjs fails the build if either field disagrees with HCC_VERSION / HCC_BUILD, so this file cannot drift from the document it describes.";
fs.writeFileSync(versionPath, JSON.stringify(version, null, 2) + '\n');

const manifestPath = 'api/manifest.json';
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.version = VERSION;
manifest.build = BUILD;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

console.log(`Materialized HCC v${VERSION} · ${BUILD}`);
// Release gate trigger: typed Integration API + shipped Time Fabric scope.
