# Template File Generator

English | [Русский](README_RU.md)

`@gromlab/template-file-generator` generates text files and folder structures from local `.templates/`. It provides a CLI, a Node.js API, and agent skills in English and Russian.

Define a repeatable structure once: filenames, exports, types, styles, and boilerplate. Generate the next component, module, or service with consistent names in both paths and file contents instead of copying and renaming files manually.

## Quick start

Requires Node.js and npm. CI runs on Node.js 22 and 24.

Create `.templates/module/{{name.kebabCase}}/index.ts`:

```typescript
export const {{name.camelCase}} = {};
```

Run from the directory containing `.templates/`:

```bash
npx --yes @gromlab/template-file-generator module user-profile src/modules --skip-update
```

The result is `src/modules/user-profile/index.ts`:

```typescript
export const userProfile = {};
```

The package uses your project's templates. Installing the CLI does not create `.templates/` or install a template collection.

## Agent skill

[skills/template-generation/SKILL.md](skills/template-generation/SKILL.md) teaches agents what the package does, when to use it, how to author templates, and how to generate and verify files. The primary skill and its references are written in English. Its main file includes a complete working example.

Install the English skill in the current project:

```bash
npx skills add gromlab-ru/template-file-generator --skill template-generation
```

Add `--global` for a user-wide installation. The installer lets you choose compatible agents. Restart your agent session after installation to load the skill. Installing the skill does not install the npm package. For the Russian skill, see [README_RU.md](README_RU.md).

## CLI installation

### Project dependency

```bash
npm install --save-dev @gromlab/template-file-generator
npx --no-install template-file-generator module user-profile src/modules --skip-update
```

Or add an npm script:

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

### Global installation and completion

```bash
npm install --global @gromlab/template-file-generator
template-file-generator install-autocomplete --shell bash
```

Use `--shell zsh` or `--shell fish` for those shells, then open a new shell. Completion is supported for globally installed CLI instances and suggests template names and variables.

## Usage

```text
template-file-generator <template> <name> [path] [options]
```

- `<template>` is an immediate subdirectory of `.templates/`.
- `<name>` is the required value of the `name` variable.
- `[path]` is the output directory relative to the working directory, defaulting to `.`. Absolute paths are supported.
- The CLI reads templates only from `<cwd>/.templates/`.

In a monorepo, each application or package may own its `.templates/`. Run from the relevant scope, such as `apps/web` or `packages/ui`. Completion and the `findNearestTemplatesDir` API search ancestor directories; CLI generation does not.

### Variables

Variables are substituted in file contents and paths. Files must be UTF-8 text. All discovered variables are required; missing values cause an error rather than an interactive prompt.

```bash
# For a template containing {{author}}
template-file-generator module user-profile src/modules --author "Platform Team" --skip-update
```

Use `{{name}}` for the original value or one of these modifiers:

| Modifier | Result for `user-profile` |
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

For example: `{{name.pascalCase}}.ts`. Modifiers work with any variable. Templates do not support conditions, loops, or automatic escaping. Binary files and empty directories are not supported.

### Options

| Option | Purpose |
| --- | --- |
| `--<variable> <value>` | String variable; `--key=value` is also supported |
| `--overwrite` | Overwrite files included in the generation plan |
| `--skip-update` | Disable the CLI update check |
| `-h`, `--help` | Show help |

Without `--overwrite`, an existing top-level template output directory or a file collision blocks generation. Writes are sequential and a filesystem error may leave partial output. `--templates`, `--out`, and `--output` are unsupported. The CLI has no `--dry-run` option.

## Programmatic API

```javascript
const { renderTemplate } = require('@gromlab/template-file-generator');

renderTemplate('{{name.pascalCase}}.ts', { name: 'user-profile' });
// 'UserProfile.ts'
```

For file generation, use `resolveTemplateContext`, `buildPlan`, collision checks, and `writePlan`. `buildPlan` previews target paths without writing. TypeScript declarations are included.

[Complete API example and reference](skills/template-generation/references/programmatic-api.md).

## Documentation

- [Package features (Russian)](docs/ru/FEATURES.md)
- [CLI reference](skills/template-generation/references/cli.md)
- [Template authoring](skills/template-generation/references/templates.md)
- [Publishing and CI/CD (Russian)](docs/ru/RELEASING.md)
- Repository examples: `.templates/component/` and `.templates/zustand-store/`.

## Development

```bash
npm ci
npm test
npm run check:package
```

`npm ci` builds TypeScript through `prepare`. `npm run check` builds, tests, and verifies the packed npm artifact. CI runs on Node.js 22 and 24. Tags matching `v*` trigger npm Trusted Publishing.

## Migrating from @gromlab/create

Version `0.3.0` is published as `@gromlab/template-file-generator`. Update your dependency, imports, and npm scripts. The new command is `template-file-generator`; the new package does not provide the old `create` or `gromlab-create` aliases. Reinstall completion for the new command after a global migration.

## License

[MIT](LICENSE).
