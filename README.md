# Template-based file generator

CLI utility for generating files and folder structures from customizable templates.

## Installation

### Quick Start with npx

```bash
npx @gromlab/create <template> <name>
```

### Global Installation (Recommended)
Global installation provides the `create` command with **autocomplete** for template names.

**1. Install:**
```bash
npm i -g @gromlab/create && create install-autocomplete
```

**2. Reload your shell:**
```bash
# macOS (zsh)
source ~/.zshrc

# Linux (bash)
source ~/.bashrc

# Linux (fish)
exec fish
```

## Usage

```bash
create <template> <name> [path] [options]
```

If `[path]` is not specified, files are created in the current directory.

## Example

```bash
# Create a component from template
create component Button

# Specify output folder positionally
create component Button src/components
```

## Templates

Templates are stored in the `.templates/` folder at the project root. Each subfolder is a separate template.

### Creating a Template

1. Create a folder in `.templates/` with the template name
2. Add files and folders using variables in names and content
3. Variables are enclosed in double curly braces: `{{variable}}`

The number of variables is unlimited — use any names you need.

### Structure

```
.templates/
├── component/
│   └── {{name.pascalCase}}/
│       ├── index.ts
│       ├── {{name.pascalCase}}.tsx
│       └── {{name.pascalCase}}.module.css
└── zustand-store/
    └── {{name.camelCase}}Store/
        ├── index.ts
        ├── {{name.camelCase}}Store.ts
        └── {{name.camelCase}}Store.type.ts
```

### Variables

Variables are substituted in file/folder names and file contents. You can use any variables in templates — the CLI will prompt for values for all found variables.

- `name` — required variable, set by positional argument
- Custom variables are passed via flags: `--author "John Doe"`

**Case Modifiers:**

| Syntax | Result for `myButton` |
|--------|----------------------|
| `{{name}}` | myButton |
| `{{name.pascalCase}}` | MyButton |
| `{{name.camelCase}}` | myButton |
| `{{name.kebabCase}}` | my-button |
| `{{name.snakeCase}}` | my_button |
| `{{name.screamingSnakeCase}}` | MY_BUTTON |

```bash
# Template with {{name}} and {{author}} variables
create component Button --author "John Doe"
```

### Template Content Example

```tsx
// {{name.pascalCase}}.tsx
import styles from './{{name.pascalCase}}.module.css'

export const {{name.pascalCase}} = () => {
  return <div className={styles.wrapper}>{{name.pascalCase}}</div>
}
```

## Options

| Option | Description |
|--------|-------------|
| `--overwrite` | Overwrite existing files |
| `--skip-update` | Skip CLI update check |
| `--<variable> <value>` | Custom template variable |

## Programmatic API

The package can be used as a library:

```typescript
import { buildPlan, writePlan, collectTemplateVariables } from '@gromlab/create';
```

| Function | Description |
|---|---|
| `renderTemplate(input, vars)` | Substitutes variables and modifiers in a string |
| `collectTemplateVariables(templateDir)` | Collects all variable names from a template |
| `listTemplateNames(templatesDir)` | Lists available templates (subdirectories) |
| `findNearestTemplatesDir(startDir)` | Walks up the directory tree looking for `.templates` |
| `readDirRecursive(dir)` | Recursive list of all files in a directory |
| `resolveTemplateContext(templatesDir, name, vars)` | Validates template and variables |
| `buildPlan(templateDir, outDir, vars, files)` | Builds generation plan (source → target) |
| `writePlan(plan, vars, overwrite)` | Writes files to disk according to the plan |
| `getCollisions(plan)` | Lists plan files that already exist on disk |
| `getExistingDirs(outDir, dirs)` | Checks which directories already exist |
| `getTopLevelDirs(outDir, plan)` | Top-level directories from the plan |
| `getRoots(outDir, plan)` | Root paths for summary output |
| `CASE_MODIFIERS` | Case modifier functions dictionary |
