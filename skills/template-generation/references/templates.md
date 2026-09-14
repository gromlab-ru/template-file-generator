# Template authoring

## Creating a useful template

1. Read local instructions and inspect several similar entities in the project.
2. Identify repeated paths, files, exports, and initial code.
3. Replace the entity name with `{{name}}` and appropriate modifiers; use separate variables for independent parameters.
4. Remove product-specific data and logic that do not apply to every future instance.
5. Save the files under `.templates/<template-name>/` in the appropriate scope.
6. Generate an entity with the package and verify it as normal project code.

Existing code is a useful source of conventions when authoring a template; use the template to generate subsequent entities. If every run needs the same adjustment, move that adjustment into the template.

## Files and directories

Each immediate subdirectory of `.templates/` is a separate template. Every regular file inside the selected template becomes an output file, including README files and dotfiles. Keep collection-level documentation in `.templates/README.md` so it is not included in a selected template's output.

Nested paths are preserved after variable substitution. For this template:

```text
.templates/service/
└── {{name.kebabCase}}/
    ├── {{name.kebabCase}}.service.ts
    ├── {{name.kebabCase}}.type.ts
    └── index.ts
```

an output directory of `src/services` is sufficient: the generator adds the entity directory itself.

Files are read and written as UTF-8. Binary resources are unsuitable for templates. Empty directories and symbolic links are not reproduced. Extensions such as `.tpl` and `.hbs` have no special treatment and remain in output filenames.

## Syntax

```text
{{name}}
{{name.pascalCase}}
{{domain.snakeCase}}
{{ entity_name.camelCase }}
```

A variable name is a sequence of Latin letters, digits, and `_`. A single modifier may follow the dot. Supported modifiers:

- `pascalCase`, `camelCase`, `kebabCase`, `snakeCase`;
- `screamingSnakeCase`;
- `upperCase`, `lowerCase`;
- `upperCaseAll`, `lowerCaseAll` — remove hyphens, underscores, and whitespace before changing case.

An unknown modifier does not raise an error: it leaves the value untransformed. Check spelling against the list. Nested object access, modifier chains, conditional blocks, and loops are not supported.

Substitution does not escape values for JavaScript, JSON, HTML, or other formats. Check that a value is suitable for the string literal or filename where it is inserted. Usually `name` supplies an entity name while the output directory is a separate argument.

## Monorepos

Place a template in the scope where its conventions apply:

```text
apps/web/.templates/
apps/admin/.templates/
packages/ui/.templates/
```

A UI-package component template may differ from a web-application component template. Select the scope before generating. The CLI does not merge multiple `.templates/` directories or infer the scope from the output directory.

Use `.templates/README.md` to document each template's purpose, required parameters, expected output directories, and commands with the correct working directory.

## Verifying a template

- Use a multiword name such as `user-profile` to exercise case conversion.
- Inspect the paths and contents of every generated file, including imports and exports.
- Check required custom variables.
- Run relevant project checks, such as type checking or existing tests.
- Use a dedicated temporary directory for trial generation; output paths are relative to the command's working directory.
- After verification, remove only the temporary output created for that trial.

Changing a template affects future invocations. Update existing code separately through targeted edits or intentional regeneration followed by diff review.
