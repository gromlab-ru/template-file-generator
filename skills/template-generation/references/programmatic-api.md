# Programmatic API

The package exports a CommonJS module and TypeScript declarations. Use `require` in Node.js or `import` in TypeScript with an appropriate module configuration.

```bash
npm install --save-dev @gromlab/template-file-generator
```

If the generator is needed at application runtime rather than just during development, install it as a regular dependency.

## Complete generation example

Save the following as a script such as `generate.cjs`. It assumes that a `module` template already exists in the working directory's `.templates/` and uses `name` and `author` variables.

```javascript
const path = require('node:path');
const {
  resolveTemplateContext,
  buildPlan,
  getCollisions,
  getTopLevelDirs,
  getExistingDirs,
  writePlan,
} = require('@gromlab/template-file-generator');

const templatesDir = path.resolve('.templates');
const outDir = path.resolve('src/modules');
const vars = { name: 'user-profile', author: 'Platform' };

const result = resolveTemplateContext(templatesDir, 'module', vars);
if (result.error) {
  throw new Error([result.error.title, ...(result.error.details ?? [])].join('\n'));
}

const { templateDir, files } = result.context;
const plan = buildPlan(templateDir, outDir, vars, files);
const collisions = getCollisions(plan);
const existingDirs = getExistingDirs(outDir, getTopLevelDirs(outDir, plan));

if (collisions.length || existingDirs.length) {
  throw new Error(`Destination already exists: ${[...collisions, ...existingDirs].join(', ')}`);
}

console.table(plan);
writePlan(plan, vars, false);
```

For a preview, stop before `writePlan`: resolving the context and building the plan do not create output files.

This example matches the CLI's conservative behavior for existing top-level directories. If an integration should add new files to an existing directory, it can check only `getCollisions` while keeping `overwrite=false`. That policy belongs to the calling code.

## Functions

| Export | Purpose |
| --- | --- |
| `renderTemplate(input, vars)` | Substitute variables and modifiers in a string |
| `collectTemplateVariables(templateDir)` | Return a `Set<string>` of variables found in file paths and contents |
| `listTemplateNames(templatesDir)` | Return sorted immediate subdirectory names |
| `findNearestTemplatesDir(startDir)` | Find the nearest `.templates/`, walking from `startDir` to the filesystem root |
| `readDirRecursive(dir)` | Return regular file paths recursively |
| `resolveTemplateContext(templatesDir, templateName, vars)` | Validate the directory, template name, variables, and presence of files |
| `buildPlan(templateDir, outDir, vars, files)` | Return `{ source, target }` entries without writing |
| `getCollisions(plan)` | Return existing target paths |
| `getTopLevelDirs(outDir, plan)` | Return relative top-level directory names from the plan |
| `getExistingDirs(outDir, dirs)` | Filter that list to existing directories |
| `getRoots(outDir, plan)` | Return root output paths for display |
| `writePlan(plan, vars, overwrite)` | Read source files, substitute variables, and write output |
| `CASE_MODIFIERS` | Map of case-conversion functions |
| `normalizeArgs(parsed)` | Validate parsed CLI arguments and assign the positional name to `vars.name` |

Exported types: `PlanItem`, `TemplateContext`, `ValidationError`, `ParsedArgs`.

## Behavioral details

- In the API, `name` is an ordinary property of `vars`. The positional-argument requirement belongs to the CLI.
- `resolveTemplateContext` returns `{ context }` or `{ error }`. Inspect `title`, `details`, and `hint` for validation errors. Filesystem read errors may throw exceptions.
- `renderTemplate` itself does not validate completeness: it replaces missing variables with empty strings. Call `resolveTemplateContext` first when generating files.
- `buildPlan` transforms paths. File contents are read and transformed during `writePlan`.
- `writePlan(..., false)` opens files with `wx`, preventing existing files from being overwritten. A preflight collision check still provides better diagnostics.
- `writePlan(..., true)` replaces target files without merging. Unrelated files are not removed.
- Files are written sequentially with no transaction or automatic rollback on failure.
- Pass absolute paths and explicitly select the template scope for predictable behavior. `findNearestTemplatesDir` is a helper; CLI generation does not call it.
