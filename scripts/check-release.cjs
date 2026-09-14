const assert = require('node:assert/strict');
const fs = require('node:fs');

function getReleaseInfo(manifest, refType, refName) {
  assert.equal(manifest.name, '@gromlab/template-file-generator', 'Неожиданное имя npm-пакета');
  assert.match(manifest.version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, 'Ожидается версия SemVer');
  assert.equal(refType, 'tag', 'Публикация разрешена только при запуске на теге');
  assert.equal(refName, `v${manifest.version}`, 'Тег должен совпадать с версией package.json');
  return { name: manifest.name, version: manifest.version, distTag: manifest.version.includes('-') ? 'next' : 'latest' };
}

async function isPublished(info, fetchRegistry = fetch) {
  const url = `https://registry.npmjs.org/${encodeURIComponent(info.name)}/${encodeURIComponent(info.version)}`;
  const response = await fetchRegistry(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15_000) });
  if (response.status === 404) return false;
  if (!response.ok) throw new Error(`Проверка npm registry завершилась HTTP ${response.status}`);
  const published = await response.json();
  assert.equal(published.name, info.name, 'Реестр вернул другое имя пакета');
  assert.equal(published.version, info.version, 'Реестр вернул другую версию');
  return true;
}

async function main() {
  const info = getReleaseInfo(require('../package.json'), process.env.GITHUB_REF_TYPE, process.env.GITHUB_REF_NAME);
  const published = await isPublished(info);
  assert.ok(process.env.GITHUB_OUTPUT, 'Команда предназначена для GitHub Actions');
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `published=${published}\ndist_tag=${info.distTag}\n`);
  console.log(published
    ? `${info.name}@${info.version} уже опубликован; повторная публикация пропущена.`
    : `${info.name}@${info.version} будет опубликован с npm-тегом ${info.distTag}.`);
}

module.exports = { getReleaseInfo, isPublished };

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
