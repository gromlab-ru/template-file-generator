# @gromlab/create

CLI-утилита для генерации файлов из шаблонов.

## Использование

```bash
npx @gromlab/create <шаблон> <имя> [опции]
```

## Пример

```bash
# Создать компонент из шаблона
npx @gromlab/create component Button

# Указать папку вывода
npx @gromlab/create component Button --out src/components

# Превью без записи
npx @gromlab/create component Button --dry-run
```

## Шаблоны

Шаблоны хранятся в папке `.templates/`. Каждая подпапка — отдельный шаблон.

```
.templates/
└── component/
    ├── {{name.pascal}}/
    │   ├── index.ts
    │   ├── {{name.pascal}}.tsx
    │   └── {{name.pascal}}.module.css
```

### Переменные

В именах файлов и содержимом доступны переменные:
- `{{name}}` — исходное значение
- `{{name.pascal}}` — PascalCase
- `{{name.camel}}` — camelCase
- `{{name.kebab}}` — kebab-case
- `{{name.snake}}` — snake_case

## Опции

| Опция | Описание |
|-------|----------|
| `--out <путь>` | Папка вывода (по умолчанию: `.`) |
| `--templates <путь>` | Папка шаблонов (по умолчанию: `.templates`) |
| `--overwrite` | Перезаписать существующие файлы |
| `--dry-run` | Показать результат без записи |
| `--<переменная> <значение>` | Произвольная переменная шаблона |
