# Публикация и CI/CD

Репозиторий: `gromlab-ru/template-file-generator`.
Пакет: `@gromlab/template-file-generator`.
Основная ветка: `main`.

## Проверки

`.github/workflows/ci.yml` запускается при push в `main`, в pull requests и вручную. На Node.js 22 и 24 выполняются:

1. `npm ci` — установка по lock-файлу и сборка через `prepare`.
2. `npm test` — генерация по примерам из обоих корневых скиллов, переменные, конфликты, API, автодополнение, ссылки скиллов и правила релиза.
3. `npm run check:package` — упаковка, установка tarball во временный проект и проверка установленного CLI, API и наличия обоих скиллов со справочниками.

Для полной локальной проверки после изменения исходников используйте `npm run check`.

## Первая публикация 0.3.0

Первый выпуск нового имени выполняется локально с существующей авторизацией npm. Это создаёт пакет, для которого затем можно настроить Trusted Publisher.

После коммита проверенных изменений и отправки `main` в GitHub:

```bash
npm whoami --registry=https://registry.npmjs.org
npm publish --access public
```

`prepublishOnly` выполняет сборку, тесты и проверку npm-архива перед публикацией. Публикуемый состав определяется `files` в `package.json`: `dist`, `skills`, русская документация README, а также автоматически включаемые `README.md`, `LICENSE` и `package.json`.

Проверка результата:

```bash
npm view @gromlab/template-file-generator@0.3.0 version dist.integrity
```

Не повторяйте публикацию после неоднозначного сетевого сбоя без проверки реестра: уже опубликованную версию npm заменить нельзя.

## Однократная настройка Trusted Publishing

После появления пакета откройте его настройки на npmjs.com и добавьте GitHub Actions в Trusted Publishers:

| Поле | Значение |
| --- | --- |
| Organization or user | `gromlab-ru` |
| Repository | `template-file-generator` |
| Workflow filename | `publish.yml` |
| Environment | Не заполнять: workflow не использует environment |
| Allowed actions | Разрешить прямой `npm publish` |

Альтернативно, при интерактивной авторизации с 2FA и npm >= 11.15.0:

```bash
npm trust github @gromlab/template-file-generator --repo gromlab-ru/template-file-generator --file publish.yml --allow-publish
npm trust list @gromlab/template-file-generator
```

Настройка доверия может потребовать подтверждения через браузер и 2FA. Права текущего токена на публикацию не означают, что им можно настроить Trusted Publisher: токены с bypass 2FA для этой операции не поддерживаются.

Workflow использует GitHub-hosted runner, Node.js 24, npm 11.16.0 и `id-token: write`. npm получает краткоживущую авторизацию через OIDC. `NPM_TOKEN` в GitHub Secrets для последующих публикаций не требуется. Provenance для публичного пакета из публичного репозитория формируется npm автоматически.

После ручной публикации зафиксируйте тег первого выпуска:

```bash
git tag -a v0.3.0 -m "v0.3.0"
git push origin v0.3.0
```

Первый запуск `publish.yml` обнаружит существующую `0.3.0` и пропустит повторную публикацию. Такой запуск проверяет обработку тега и реестра, но не проверяет публикацию через OIDC — она будет проверена на следующей новой версии.

## Последующие релизы

1. Подготовьте изменения, обновите примеры и скилл, если изменился пользовательский интерфейс пакета.
2. Поднимите версию и lock-файл, например командой `npm version patch --no-git-tag-version`. Согласованно обновите `metadata.version` и закреплённые версии в примерах обоих скиллов.
3. Выполните `npm run check`, закоммитьте изменения и отправьте `main` в GitHub.
4. Убедитесь, что CI прошёл.
5. Создайте тег `v<version>` на проверенном коммите и отправьте его в GitHub.

Пример тега для версии `0.3.2`:

```bash
git tag -a v0.3.2 -m "v0.3.2"
git push origin v0.3.2
```

`.github/workflows/publish.yml` запускается по push тегов `v*`:

- имя пакета должно быть `@gromlab/template-file-generator`;
- тег обязан точно совпадать с `v` + `package.json.version`;
- существующая версия пропускается;
- только HTTP 404 считается отсутствием версии; ошибки сети, авторизации и реестра останавливают workflow;
- перед новой публикацией выполняются все проверки через `prepublishOnly`;
- обычные версии публикуются с npm-тегом `latest`, версии с суффиксом вроде `0.4.0-beta.1` — с `next`.

Для повторного запуска используйте Re-run jobs либо ручной запуск workflow на нужном **теге**. Ручной запуск на ветке отклоняется проверкой версии.

## Если публикация не проходит

- Проверьте точное совпадение `gromlab-ru`, `template-file-generator` и `publish.yml` в настройке npm Trusted Publisher.
- Убедитесь, что разрешён `npm publish`, а не только staged publishing.
- Проверьте `repository.url` в `package.json`: `git+https://github.com/gromlab-ru/template-file-generator.git`.
- Проверьте совпадение тега и версии пакета.
- Не используйте `npm whoami` для проверки OIDC внутри CI: OIDC-авторизация выполняется самим `npm publish`.
