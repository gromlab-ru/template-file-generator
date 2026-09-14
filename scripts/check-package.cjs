const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createRequire } = require('node:module');
const { spawnSync } = require('node:child_process');
const manifest = require('../package.json');

const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'template-file-generator-package-'));

function npm(args, cwd) {
  assert.ok(process.env.npm_execpath, 'Запускайте проверку через npm run check:package');
  const result = spawnSync(process.execPath, [process.env.npm_execpath, ...args], {
    cwd,
    encoding: 'utf8',
    timeout: 120_000,
  });
  assert.equal(result.status, 0, result.error?.message ?? result.stderr ?? result.stdout);
  return result.stdout;
}

try {
  // prepare/prepublishOnly уже проверяются внешней сборкой; повторный pack не запускает их рекурсивно.
  const [packed] = JSON.parse(npm(['pack', '--json', '--ignore-scripts', '--pack-destination', temp], root));
  const paths = new Set(packed.files.map((file) => file.path));
  const required = [
    'dist/cli.js', 'dist/index.js', 'dist/index.d.ts', 'dist/packageInfo.js',
    'package.json', 'README.md', 'README_RU.md', 'LICENSE',
    ...['template-generation', 'template-generation-ru'].flatMap((name) => [
      'SKILL.md', 'references/cli.md', 'references/templates.md', 'references/programmatic-api.md',
    ].map((file) => `skills/${name}/${file}`)),
  ];
  for (const file of required) assert.ok(paths.has(file), `В npm-пакете отсутствует ${file}`);
  for (const file of paths) {
    assert.ok(/^(dist\/|skills\/|package\.json$|README(?:_RU)?\.md$|LICENSE$)/.test(file), `Лишний файл: ${file}`);
  }

  const consumer = path.join(temp, 'consumer');
  fs.mkdirSync(consumer);
  fs.writeFileSync(path.join(consumer, 'package.json'), JSON.stringify({ name: 'package-smoke-test', private: true }));
  npm(['install', '--no-audit', '--no-fund', '--package-lock=false', path.join(temp, packed.filename)], consumer);

  const consumerRequire = createRequire(path.join(consumer, 'package.json'));
  const api = consumerRequire(manifest.name);
  assert.equal(api.renderTemplate('{{name.pascalCase}}.ts', { name: 'user-profile' }), 'UserProfile.ts');
  const installedDir = path.dirname(consumerRequire.resolve(`${manifest.name}/package.json`));
  for (const file of required) assert.ok(fs.existsSync(path.join(installedDir, file)), file);

  const help = npm(['exec', '--offline', '--', 'template-file-generator', '--help', '--skip-update'], consumer);
  assert.match(help, /template-file-generator <шаблон>/);

  const template = path.join(consumer, '.templates/module/{{name.kebabCase}}');
  fs.mkdirSync(template, { recursive: true });
  fs.writeFileSync(path.join(template, 'index.ts'), 'export const {{name.camelCase}} = {};\n');
  npm(['exec', '--offline', '--', 'template-file-generator', 'module', 'user-profile', 'output', '--skip-update'], consumer);
  assert.equal(fs.readFileSync(path.join(consumer, 'output/user-profile/index.ts'), 'utf8'), 'export const userProfile = {};\n');
  console.log(`${manifest.name}@${manifest.version}: проверены состав архива, установка, CLI, API и файлы скилла.`);
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
