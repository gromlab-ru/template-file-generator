const assert = require('node:assert/strict');
const { test } = require('node:test');
const { getReleaseInfo, isPublished } = require('../scripts/check-release.cjs');

const manifest = { name: '@gromlab/template-file-generator', version: '0.3.0' };

test('релиз проверяет имя пакета, тип ref и совпадение версии с тегом', () => {
  assert.deepEqual(getReleaseInfo(manifest, 'tag', 'v0.3.0'), { ...manifest, distTag: 'latest' });
  assert.throws(() => getReleaseInfo(manifest, 'branch', 'main'), /теге/);
  assert.throws(() => getReleaseInfo(manifest, 'tag', 'v0.4.0'), /совпадать/);
  assert.throws(() => getReleaseInfo({ ...manifest, name: '@gromlab/create' }, 'tag', 'v0.3.0'), /имя/);
});

test('предварительный релиз получает npm dist-tag next', () => {
  const prerelease = { ...manifest, version: '0.4.0-beta.1' };
  assert.equal(getReleaseInfo(prerelease, 'tag', 'v0.4.0-beta.1').distTag, 'next');
});

test('только 404 означает отсутствие версии; ошибки реестра останавливают релиз', async () => {
  assert.equal(await isPublished(manifest, async () => ({ status: 404 })), false);
  assert.equal(await isPublished(manifest, async () => ({ status: 200, ok: true, json: async () => manifest })), true);
  for (const status of [401, 403, 429, 500]) {
    await assert.rejects(isPublished(manifest, async () => ({ status, ok: false })), new RegExp(`HTTP ${status}`));
  }
  await assert.rejects(isPublished(manifest, async () => { throw new Error('network unavailable'); }), /network unavailable/);
  await assert.rejects(isPublished(manifest, async () => ({ status: 200, ok: true, json: async () => ({ ...manifest, version: '0.1.0' }) })), /другую версию/);
});
