# @gromlab/create

CLI-утилита для генерации файлов из шаблонов.

## Установка

Глобально:

```bash
npm i -g @gromlab/create
```
При запуске CLI проверяет доступность новой версии. Если вы выбираете «нет»,
повторный запрос появится через 24 часа. Чтобы пропустить проверку, используйте
флаг `--skip-update`.

## Автодополнение

Установка вместе с автодополнением (одной командой):

**bash**
```bash
npm i -g @gromlab/create && create install-autocomplete --shell bash && source ~/.bashrc
```

**zsh**
```bash
npm i -g @gromlab/create && create install-autocomplete --shell zsh && source ~/.zshrc
```

**fish**
```bash
npm i -g @gromlab/create && create install-autocomplete --shell fish && exec fish
```


## Использование

```bash
create <шаблон> <имя> [путь] [опции]
```

Если `[путь]` не указан, файлы создаются в директории, где запущен CLI.

## Пример

```bash
# Создать компонент из шаблона
create component Button

# Указать папку вывода позиционно
create component Button src/components
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

Переменная `name` задается только позиционным аргументом `<имя>`. Использование `--name` запрещено.

## Опции

| Опция | Описание |
|-------|----------|
| `--overwrite` | Перезаписать существующие файлы |
| `--skip-update` | Не проверять обновления CLI |
| `--<переменная> <значение>` | Произвольная переменная шаблона |
