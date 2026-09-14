# Template File Generator

[English](README.md) | Русский

`@gromlab/template-file-generator` создаёт текстовые файлы и структуру папок из локальных `.templates/`. Пакет предоставляет CLI, программный API Node.js и русскоязычный скилл для AI-агентов.

Шаблон фиксирует повторяемую структуру один раз: имена файлов, экспорты, типы, стили и исходный код. При создании следующего компонента, модуля или сервиса генератор согласованно подставляет имя и другие переменные в пути и содержимое файлов.

## Быстрый старт

Требуются Node.js и npm. Проверки проекта выполняются на Node.js 22 и 24.

Создайте файл `.templates/module/{{name.kebabCase}}/index.ts`:

```typescript
export const {{name.camelCase}} = {};
```

Запустите из каталога, содержащего `.templates/`:

```bash
npx --yes @gromlab/template-file-generator module user-profile src/modules --skip-update
```

Результат — `src/modules/user-profile/index.ts`:

```typescript
export const userProfile = {};
```

Пакет использует шаблоны вашего проекта. Установка CLI сама по себе не создаёт `.templates/` и не устанавливает набор шаблонов.

## Скилл для AI-агентов

[skills/template-generation/SKILL.md](skills/template-generation/SKILL.md) объясняет назначение пакета, решаемые проблемы, синтаксис, полный пример генерации и рабочий алгоритм агента. Основная инструкция и справочники написаны на русском языке.

Установка в текущий проект для OpenCode:

```bash
npx skills add gromlab-ru/template-file-generator --skill template-generation --agent opencode
```

Для глобальной установки добавьте `--global`. Инструмент `skills` также поддерживает другие совместимые агенты. После установки в OpenCode перезапустите его, чтобы новый скилл загрузился. Установка скилла и установка самого npm-пакета — отдельные операции.

## Установка CLI

### Локальная зависимость

```bash
npm install --save-dev @gromlab/template-file-generator
npx --no-install template-file-generator module user-profile src/modules --skip-update
```

Можно добавить npm script:

```json
{
  "scripts": {
    "generate": "template-file-generator"
  }
}
```

```bash
npm run generate -- module user-profile src/modules --skip-update
```

### Глобальная установка и автодополнение

```bash
npm install --global @gromlab/template-file-generator
template-file-generator install-autocomplete --shell bash
```

Для zsh или fish замените значение `--shell`. После установки откройте новую оболочку. Автодополнение доступно для глобальной установки и подсказывает шаблоны и их переменные.

## Использование

```text
template-file-generator <шаблон> <имя> [путь] [опции]
```

- `<шаблон>` — непосредственная подпапка `.templates/`.
- `<имя>` — обязательное значение `name`.
- `[путь]` — папка вывода относительно рабочего каталога, по умолчанию `.`; допускается абсолютный путь.
- CLI ищет шаблоны только в `<cwd>/.templates/`.

В монорепозитории `.templates/` может находиться в `apps/web`, `apps/admin` или `packages/ui`. Запускайте CLI из нужной области. Поиск ближайшей `.templates/` вверх по дереву используется автодополнением и отдельной функцией API, но не генерацией CLI.

### Переменные

Переменные подставляются в пути и содержимое текстовых файлов UTF-8. Все найденные переменные обязательны. При пропущенном значении CLI возвращает ошибку, а не интерактивный вопрос.

```bash
# Для шаблона, содержащего {{author}}
template-file-generator module user-profile src/modules --author "Platform Team" --skip-update
```

Поддерживаются `{{name}}` и девять модификаторов:

| Модификатор | Результат для `user-profile` |
| --- | --- |
| `pascalCase` | `UserProfile` |
| `camelCase` | `userProfile` |
| `kebabCase` | `user-profile` |
| `snakeCase` | `user_profile` |
| `screamingSnakeCase` | `USER_PROFILE` |
| `upperCase` | `USER-PROFILE` |
| `lowerCase` | `user-profile` |
| `upperCaseAll` | `USERPROFILE` |
| `lowerCaseAll` | `userprofile` |

Пример: `{{name.pascalCase}}.ts`. Модификаторы применимы к любой переменной. Условий, циклов и автоматического экранирования значений нет; бинарные файлы и пустые папки не поддерживаются.

### Опции

| Опция | Назначение |
| --- | --- |
| `--<переменная> <значение>` | Строковая переменная; также допустимо `--ключ=значение` |
| `--overwrite` | Перезапись файлов из плана генерации |
| `--skip-update` | Отключение проверки обновлений CLI |
| `-h`, `--help` | Справка |

Без `--overwrite` генерация останавливается при существующей верхней папке из шаблона или конфликте файлов. Запись последовательная: при ошибке файловой системы возможен частичный результат. Параметры `--templates`, `--out`, `--output` не поддерживаются; у CLI нет `--dry-run`.

## Программный API

```javascript
const { renderTemplate } = require('@gromlab/template-file-generator');

renderTemplate('{{name.pascalCase}}.ts', { name: 'user-profile' });
// 'UserProfile.ts'
```

Для генерации файлов используйте `resolveTemplateContext`, `buildPlan`, проверки конфликтов и `writePlan`. `buildPlan` позволяет посмотреть план без записи. Пакет включает TypeScript-декларации.

[Полный пример API и справочник функций](skills/template-generation/references/programmatic-api.md).

## Документация

- [Возможности пакета](docs/ru/FEATURES.md)
- [Справочник CLI](skills/template-generation/references/cli.md)
- [Проектирование шаблонов](skills/template-generation/references/templates.md)
- [Публикация и CI/CD](docs/ru/RELEASING.md)
- Примеры в репозитории: `.templates/component/` и `.templates/zustand-store/`.

## Разработка

```bash
npm ci
npm test
npm run check:package
```

`npm ci` собирает TypeScript через `prepare`. `npm run check` выполняет сборку, тесты и проверку упакованного npm-пакета. CI запускает проверки на Node.js 22 и 24; теги `v*` запускают публикацию через npm Trusted Publishing.

## Переход с @gromlab/create

Версия `0.3.0` публикуется как `@gromlab/template-file-generator`. Обновите зависимость, импорты и npm scripts. Новая команда — `template-file-generator`; старые алиасы `create` и `gromlab-create` в новом пакете отсутствуют. После глобального перехода переустановите автодополнение для новой команды.

## Лицензия

[MIT](LICENSE).
