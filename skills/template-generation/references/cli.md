# CLI reference

Package: `@gromlab/template-file-generator`. Executable: `template-file-generator`. This reference describes version `0.3.1`.

## Choosing an invocation method

### Project dependency

Inspect `package.json`, the lockfile, and local documentation. Use the project's generation script if one exists. After installing this package in `devDependencies`, a script can be configured as follows:

```json
{
  "scripts": {
    "generate": "template-file-generator"
  }
}
```

Run from the directory containing both the intended `.templates/` and this `package.json`:

```bash
npm run generate -- module user-profile src/modules --author Platform --skip-update
```

Or invoke the installed executable directly:

```bash
npx --no-install template-file-generator module user-profile src/modules --author Platform --skip-update
```

In a monorepo, npm scripts run from their package directory. A root script may select a different template scope from a command invoked directly in an application directory.

### On-demand execution

```bash
npx --yes @gromlab/template-file-generator@0.3.1 module user-profile src/modules --author Platform --skip-update
```

`--yes` belongs to `npx` and confirms package download. `--skip-update` after the arguments belongs to the generator. `npx` may access the registry and use the npm cache; pin a version or use a lockfile-backed project dependency for reproducible execution.

### Global installation

```bash
npm install --global @gromlab/template-file-generator
template-file-generator module user-profile src/modules --author Platform --skip-update
```

Global installation is useful for people who regularly use the CLI and shell completion. A project dependency or `npx` is sufficient for agents.

## Arguments and values

```text
template-file-generator <template> <name> [path] [options]
```

- The template name matches an immediate subdirectory of `.templates/`.
- `name` is positional and required even when the template does not use it.
- The output directory defaults to the command's working directory.
- `--key value` and `--key=value` supply string variables.
- Quote values containing spaces: `--author "Platform Team"`.
- For a value starting with `-`, use `--key=-value`.
- `--overwrite`, `--skip-update`, `--help`, and `-h` are CLI options.
- `--name`, `--templates`, `--templatesPath`, `--templates-path`, `--out`, and `--output` are unsuitable as custom CLI variables.
- Do not pass extra positional arguments or presumed options such as `--dry-run` and `--version`.

Identify variables by reading template paths and contents or calling `collectTemplateVariables` through the API. Missing values cause an error before any files are created.

## Template scope

Given this structure:

```text
apps/
├── admin/.templates/
└── web/.templates/
```

set the process working directory to `apps/web` to use the web application's templates. An output argument of `src/modules` is relative to that directory.

CLI generation does not search ancestor directories. Upward lookup is implemented separately by `findNearestTemplatesDir` and shell completion. A shell may therefore suggest a template that generation cannot access from a nested directory: switch the working directory to the chosen scope before generating.

## Overwriting and output

Before writing, the CLI checks top-level directories defined by the template and file collisions. An existing top-level directory blocks generation without `--overwrite`, even when none of the target files exist inside it.

`--overwrite` replaces files included in the plan. Other files are not removed. The generator does not merge file contents or automatically update existing output when a template changes.

A successful command prints paths, an output tree, and variable values. Argument, validation, and filesystem errors result in a nonzero exit code. Writes are sequential with no rollback: inspect partial output after an I/O failure.

## Shell completion

After global installation:

```bash
template-file-generator install-autocomplete --shell bash
template-file-generator install-autocomplete --shell zsh
template-file-generator install-autocomplete --shell fish
```

Run only the command for your shell. Installation changes that shell's user configuration. For bash/zsh, open a new shell or reload its rc file; for fish, open a new session.

Print a completion script without installing it:

```bash
template-file-generator completion --shell bash
```

Completion commands require global installation. The internal `__list-templates` and `__list-vars <template>` commands support the shell; they are not the main user-facing generation interface.

## Updating

During an interactive invocation, the CLI may offer a global package update. This check is skipped under `npx`, without a TTY, or with `--skip-update`. Agents should pass `--skip-update` and change dependency versions through the project's package manager.
