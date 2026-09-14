const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');
const api = require('../dist');
const { BIN_NAME, PACKAGE_NAME } = require('../dist/packageInfo');
const manifest = require('../package.json');

const root = path.resolve(__dirname, '..');
const cli = path.join(root, 'dist/cli.js');
const skills = ['template-generation', 'template-generation-ru'].map((name) => {
  const dir = path.join(root, 'skills', name);
  const source = fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8');
  const blocks = [...source.matchAll(/```typescript\n([\s\S]*?)\n```/g)].map((match) => `${match[1]}\n`);
  return { name, dir, source, blocks };
});
const exampleBlocks = skills[0].blocks;

function fixture(t, blocks = exampleBlocks) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'template-file-generator-test-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  const template = path.join(cwd, '.templates/module/{{name.kebabCase}}');
  fs.mkdirSync(template, { recursive: true });
  fs.writeFileSync(path.join(template, '{{name.kebabCase}}.ts'), blocks[0]);
  fs.writeFileSync(path.join(template, 'index.ts'), blocks[1]);
  return cwd;
}

function run(cwd, args) {
  return spawnSync(process.execPath, [cli, ...args, '--skip-update'], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  });
}

for (const skill of skills) {
  test(`${skill.name}: пример из корневого SKILL.md создаёт документированные файлы и экспорты`, (t) => {
    assert.ok(skill.source.includes('module user-profile src/modules --author Platform --skip-update'));
    assert.equal(skill.blocks.length, 4);
    const cwd = fixture(t, skill.blocks);
    const result = run(cwd, ['module', 'user-profile', 'src/modules', '--author', 'Platform']);
    assert.equal(result.status, 0, result.stderr);
    const out = path.join(cwd, 'src/modules/user-profile');
    assert.deepEqual(fs.readdirSync(out).sort(), ['index.ts', 'user-profile.ts']);
    assert.equal(fs.readFileSync(path.join(out, 'user-profile.ts'), 'utf8'), skill.blocks[2]);
    assert.equal(fs.readFileSync(path.join(out, 'index.ts'), 'utf8'), skill.blocks[3]);
  });
}

test('недостающая переменная вызывает ошибку до создания выходного каталога', (t) => {
  const cwd = fixture(t);
  const result = run(cwd, ['module', 'user-profile', 'output']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /--author/);
  assert.equal(fs.existsSync(path.join(cwd, 'output')), false);
});

test('существующие файлы сохраняются при повторной генерации без overwrite', (t) => {
  const cwd = fixture(t);
  const args = ['module', 'user-profile', 'output', '--author', 'Platform'];
  assert.equal(run(cwd, args).status, 0);
  const target = path.join(cwd, 'output/user-profile/user-profile.ts');
  fs.writeFileSync(target, '// пользовательское изменение\n');
  const result = run(cwd, args);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Папка назначения уже существует/);
  assert.equal(fs.readFileSync(target, 'utf8'), '// пользовательское изменение\n');
});

test('существующая пустая верхняя папка тоже блокирует генерацию', (t) => {
  const cwd = fixture(t);
  const out = path.join(cwd, 'output/user-profile');
  fs.mkdirSync(out, { recursive: true });
  const result = run(cwd, ['module', 'user-profile', 'output', '--author', 'Platform']);
  assert.equal(result.status, 1);
  assert.deepEqual(fs.readdirSync(out), []);
});

test('overwrite заменяет файлы плана, сохраняя посторонние файлы', (t) => {
  const cwd = fixture(t);
  const args = ['module', 'user-profile', 'output', '--author=Platform'];
  assert.equal(run(cwd, args).status, 0);
  const out = path.join(cwd, 'output/user-profile');
  fs.writeFileSync(path.join(out, 'user-profile.ts'), '// старая версия');
  fs.writeFileSync(path.join(out, 'notes.txt'), 'сохранить');
  const result = run(cwd, [...args, '--overwrite']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.readFileSync(path.join(out, 'user-profile.ts'), 'utf8'), exampleBlocks[2]);
  assert.equal(fs.readFileSync(path.join(out, 'notes.txt'), 'utf8'), 'сохранить');
});

test('CLI использует cwd, а вспомогательный API умеет искать область вверх', (t) => {
  const cwd = fixture(t);
  const nested = path.join(cwd, 'app');
  fs.mkdirSync(nested);
  assert.equal(api.findNearestTemplatesDir(nested), path.join(cwd, '.templates'));
  const result = run(nested, ['module', 'user-profile', 'output', '--author', 'Platform']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Папка шаблонов не найдена/);
  assert.equal(fs.existsSync(path.join(nested, 'output')), false);
});

test('программный API валидирует, строит план без записи и затем создаёт файлы', (t) => {
  const cwd = fixture(t);
  const outDir = path.join(cwd, 'output');
  const vars = { name: 'user-profile', author: 'Platform' };
  const result = api.resolveTemplateContext(path.join(cwd, '.templates'), 'module', vars);
  assert.equal(result.error, undefined);
  const { templateDir, files } = result.context;
  assert.deepEqual([...api.collectTemplateVariables(templateDir)].sort(), ['author', 'name']);
  const plan = api.buildPlan(templateDir, outDir, vars, files);
  assert.equal(plan.length, 2);
  assert.equal(fs.existsSync(outDir), false);
  assert.deepEqual(api.getCollisions(plan), []);
  api.writePlan(plan, vars, false);
  assert.equal(api.getCollisions(plan).length, 2);
  assert.equal(fs.readFileSync(path.join(outDir, 'user-profile/user-profile.ts'), 'utf8'), exampleBlocks[2]);
});

test('таблицы модификаторов в обоих скиллах соответствуют результату API', () => {
  for (const skill of skills) {
    const rows = [...skill.source.matchAll(/\| `({{name(?:\.[a-zA-Z]+)?}})` \| `([^`]+)` \|/g)];
    assert.equal(rows.length, 10, skill.name);
    for (const [, input, expected] of rows) {
      assert.equal(api.renderTemplate(input, { name: 'user-profile' }), expected, `${skill.name}: ${input}`);
    }
  }
});

test('публичное имя согласовано со справкой, бин имеет только новое имя', () => {
  assert.equal(PACKAGE_NAME, manifest.name);
  assert.deepEqual(manifest.bin, { [BIN_NAME]: 'dist/cli.js' });
  const result = run(root, ['--help']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /template-file-generator <шаблон>/);
  assert.doesNotMatch(result.stdout, /gromlab-create/);
});

test('автодополнение bash, zsh и fish вызывает новую команду', () => {
  for (const shell of ['bash', 'zsh', 'fish']) {
    const result = spawnSync(process.execPath, ['-e', `
      process.argv = ['node', '/opt/template-file-generator/dist/cli.js'];
      require('./dist/completion').handleInternalCommand(['completion', '--shell', ${JSON.stringify(shell)}]);
    `], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, npm_command: '', npm_execpath: '' },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /template-file-generator __list-templates/);
    assert.doesNotMatch(result.stdout, /gromlab-create|gromlab_create/);
  }
});

test('оба скилла имеют корректные метаданные и самостоятельные локальные справочники', () => {
  for (const skill of skills) {
    assert.ok(skill.source.startsWith(`---\nname: ${skill.name}\n`));
    const description = skill.source.match(/^description: "(.+)"$/m)?.[1];
    assert.ok(description && description.length <= 1024);
    if (skill.name.endsWith('-ru')) assert.match(description, /[А-Яа-яЁё]/);
    else assert.doesNotMatch(description, /[А-Яа-яЁё]/);
    assert.match(skill.source, /^license: MIT$/m);
    assert.equal(skill.source.match(/^  version: "(.+)"$/m)?.[1], manifest.version);
    const documents = [path.join(skill.dir, 'SKILL.md'), ...fs.readdirSync(path.join(skill.dir, 'references'))
      .map((name) => path.join(skill.dir, 'references', name))];
    for (const document of documents) {
      const text = fs.readFileSync(document, 'utf8');
      for (const [, link] of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
        if (/^(https?:|#)/.test(link)) continue;
        const target = path.resolve(path.dirname(document), link.split('#')[0]);
        assert.ok(target.startsWith(`${skill.dir}${path.sep}`), link);
        assert.ok(fs.existsSync(target), `${document}: ${link}`);
      }
    }
  }
});
