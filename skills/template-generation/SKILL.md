---
name: template-generation
description: "Teaches agents to use @gromlab/template-file-generator: generating files through its CLI and Node.js API, and creating or updating local .templates. Use when working with this package, configuring templates, or creating repeatable file structures such as components, modules, services, and other boilerplate. Helps select the template scope, supply variables, and verify generated output."
license: MIT
compatibility: "Running the package requires Node.js and npm. Downloading it through npx requires access to the npm registry."
metadata:
  package: "@gromlab/template-file-generator"
  version: "0.3.1"
  language: "en"
---

# Template-based file generation

## What this package is and why to use it

`@gromlab/template-file-generator` generates text files and folder structures from local templates. It provides the `template-file-generator` command and a Node.js API. Templates live in the `.templates/` directory of a project, application, or monorepo package.

The package solves repeatable-code problems: copying components, modules, services, or stores by hand can leave an old export name, omit a type file, or carry over unrelated business logic. A template defines the structure, names, and initial code once. The generator substitutes values and reproduces that convention for each new entity.

For example, a `module` template with `name=user-profile` can create `user-profile/user-profile.ts` and `user-profile/index.ts`, consistently inserting `userProfile` into their exports. Templates work with any language or framework as long as the files are UTF-8 text.

The workflow is: **select a local template → supply a name and variables → choose an output directory → generate → verify**. The project defines template contents; installing the package does not create `.templates/`.

## How to run the generator

If the project already defines a generator through npm scripts or local instructions, follow that workflow. If this package is installed, use its project-local version through an npm script or `npx --no-install template-file-generator`.

If it is not installed, run the version described by this skill on demand:

```bash
npx --yes @gromlab/template-file-generator@0.3.1 <template> <name> [path] [options]
```

For regular use, add the package as a development dependency:

```bash
npm install --save-dev @gromlab/template-file-generator
npx --no-install template-file-generator module user-profile src/modules --author Platform --skip-update
```

Arguments:

| Argument | Meaning |
| --- | --- |
| `<template>` | An immediate subdirectory of `.templates/`, such as `module` |
| `<name>` | The required value of the `name` variable, such as `user-profile` |
| `[path]` | Output directory relative to the working directory; defaults to `.`. Absolute paths are supported |
| `--author Platform` | A custom variable named `author`; `--author=Platform` is also supported |
| `--skip-update` | Disable the CLI update check; useful for agent execution |
| `--overwrite` | Allow overwriting files included in the generation plan |
| `--help` | Display CLI help |

**The working directory matters:** the CLI only reads `<cwd>/.templates/`. The positional `[path]` changes the output location, not the template search location. For `apps/web/.templates/`, set the command's working directory to `apps/web`; then `src/modules` means `apps/web/src/modules`.

## Complete example: from a template to generated files

Suppose the project needs a repeatable module with an implementation file and an export file. Create this template if it matches the project's conventions:

```text
.templates/
└── module/
    └── {{name.kebabCase}}/
        ├── {{name.kebabCase}}.ts
        └── index.ts
```

File `.templates/module/{{name.kebabCase}}/{{name.kebabCase}}.ts`:

```typescript
export const {{name.camelCase}} = {
  owner: '{{author}}',
};
```

File `.templates/module/{{name.kebabCase}}/index.ts`:

```typescript
export { {{name.camelCase}} } from './{{name.kebabCase}}';
```

Run from the directory containing `.templates/`:

```bash
npx --yes @gromlab/template-file-generator@0.3.1 module user-profile src/modules --author Platform --skip-update
```

Output:

```text
src/modules/
└── user-profile/
    ├── user-profile.ts
    └── index.ts
```

Generated `user-profile.ts`:

```typescript
export const userProfile = {
  owner: 'Platform',
};
```

Generated `index.ts`:

```typescript
export { userProfile } from './user-profile';
```

The template already includes the `user-profile` directory. Pass `src/modules` to avoid an extra `src/modules/user-profile/user-profile` nesting level.

## Variables and naming transformations

Variables apply to filenames, directory names, and file contents. `name` is always the second positional argument. Supply other variables as `--key value`. Every variable discovered in the template is required: a missing or empty value causes the CLI to exit with an error listing the missing parameters.

For `name=user-profile`:

| Expression | Result |
| --- | --- |
| `{{name}}` | `user-profile` |
| `{{name.pascalCase}}` | `UserProfile` |
| `{{name.camelCase}}` | `userProfile` |
| `{{name.kebabCase}}` | `user-profile` |
| `{{name.snakeCase}}` | `user_profile` |
| `{{name.screamingSnakeCase}}` | `USER_PROFILE` |
| `{{name.upperCase}}` | `USER-PROFILE` |
| `{{name.lowerCase}}` | `user-profile` |
| `{{name.upperCaseAll}}` | `USERPROFILE` |
| `{{name.lowerCaseAll}}` | `userprofile` |

The same modifiers work with other variables, such as `{{domain.pascalCase}}`. Variable names use Latin letters, digits, and `_`, for example `entity_name`. One modifier after the dot is supported. The template engine performs text substitution; it does not evaluate conditions, loops, expressions, or automatically escape string values.

## Agent workflow

1. **Read project instructions.** Identify the entity's purpose, architectural location, and naming conventions. This skill does not impose its own architecture or framework.
2. **Select the template scope.** Find `.templates/` for the relevant application or package and read `.templates/README.md` if present. A monorepo may have both `apps/web/.templates/` and `packages/ui/.templates/`.
3. **Inspect the existing template.** Check its paths, contents, and all variables. Use a suitable existing template instead of copying a module by hand.
4. **Prepare a template when needed.** For a new repeatable structure, extract common conventions from the actual project, replace variable names with placeholders, and save it in the appropriate `.templates/`. Then generate the entity. A unique, localized edit does not require a new template.
5. **Choose output and parameters.** Account for directories already included in the template and collect values for all variables. Quote arguments containing spaces. Use values suitable for the generated code and filenames.
6. **Run the CLI from the selected scope.** Prefer the installed project version; use the command above for an on-demand invocation. Observe the exit code and CLI output.
7. **Verify the result.** Check actual paths, substituted names, exports, and unresolved placeholders. Add entity-specific logic and run relevant project checks.
8. **Fix recurring issues at their source.** If every generated entity needs the same adjustment, update the template. Changing a template does not automatically update files generated earlier.

## Troubleshooting

The CLI currently displays these errors in Russian:

| Message | Action |
| --- | --- |
| `Папка шаблонов не найдена` | Template directory missing: check the working directory and `.templates/`; changing the output argument does not fix template lookup |
| `Шаблон не найден` | Template missing: inspect the names listed by the CLI and the contents of `.templates/` |
| `Не заданы переменные шаблона` | Missing variables: supply the listed `--variable value` arguments; values are not prompted interactively |
| `Переменная name задается только позиционно` | Pass the name after the template name and remove `--name` |
| `Папка назначения уже существует` or `Файлы уже существуют` | Output already exists: inspect the destination and existing files, then choose a new name/path or an intentional overwrite |
| `Шаблон пустой` | Empty template: add files; empty directories alone are not generated |

The CLI rejects generation when a top-level directory from the plan already exists, even if the target files are absent. Use `--overwrite` only when the task calls for replacing those files and you have reviewed their changes. Writes are not transactional: after a filesystem error, inspect any partial output before retrying.

Use only the documented options. The CLI rejects `--templates`, `--templatesPath`, `--templates-path`, `--out`, and `--output`. It has no public `init` or `list` command and no `--dry-run` option; an arbitrary flag may be interpreted as a template variable. To display help:

```bash
npx --yes @gromlab/template-file-generator@0.3.1 --help --skip-update
```

## Using the package as a library

For a custom generator, editor integration, or a preview without writing files, use the installed package's Node.js API:

```javascript
const { renderTemplate } = require('@gromlab/template-file-generator');

const filename = renderTemplate('{{name.pascalCase}}.ts', { name: 'user-profile' });
// filename === 'UserProfile.ts'
```

For file generation: `resolveTemplateContext` validates the template and variables → `buildPlan` creates `{ source, target }` entries → `getCollisions` and directory checks detect existing output → `writePlan` writes files. In the API, pass `name` in the variables object. `buildPlan` does not write to disk; handle validation errors before writing.

## Additional references

The main scenarios are fully covered above. Open a reference when the task needs more detail:

- [CLI reference](references/cli.md) — installation methods, npm scripts, global completion, and invocation modes.
- [Template authoring](references/templates.md) — extracting repeatable structures, monorepo scopes, limitations, and validation.
- [Programmatic API](references/programmatic-api.md) — complete plan-and-write example, types, and function behavior.
