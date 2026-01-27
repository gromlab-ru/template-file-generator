# Генератор файлов из шаблонов

CLI-утилита для генерации файлов и структуры папок из настраиваемых шаблонов.

## Установка

### Быстрый запуск через npx

```bash
npx @gromlab/create <шаблон> <имя>
```

### Глобальная установка ( Рекомендуется )
При глобальной установке доступна команда `create` с **автодополнением** имен шаблонов.

**1. Установка:**
```bash
npm i -g @gromlab/create && create install-autocomplete
```

**2. Перезагрузка оболочки:**
```bash
# macOS (zsh)
source ~/.zshrc

# Linux (bash)
source ~/.bashrc

# Linux (fish)
exec fish
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

Шаблоны хранятся в папке `.templates/` в корне проекта. Каждая подпапка — отдельный шаблон.

### Создание шаблона

1. Создайте папку в `.templates/` с именем шаблона
2. Добавьте файлы и папки, используя переменные в именах и содержимом
3. Переменные заключаются в двойные фигурные скобки: `{{переменная}}`

Количество переменных не ограничено — используйте любые имена.

### Структура

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

### Переменные

Переменные подставляются в имена файлов/папок и в содержимое файлов. В шаблоне можно использовать любые переменные — при генерации CLI потребует значения для всех найденных.

- `name` — обязательная переменная, задается позиционным аргументом
- Произвольные переменные передаются через флаги: `--author "John Doe"`

**Модификаторы регистра:**

| Синтаксис | Результат для `myButton` |
|-----------|--------------------------|
| `{{name}}` | myButton |
| `{{name.pascalCase}}` | MyButton |
| `{{name.camelCase}}` | myButton |
| `{{name.kebabCase}}` | my-button |
| `{{name.snakeCase}}` | my_button |
| `{{name.screamingSnakeCase}}` | MY_BUTTON |

```bash
# Шаблон с переменными {{name}} и {{author}}
create component Button --author "John Doe"
```

### Пример содержимого шаблона

```tsx
// {{name.pascalCase}}.tsx
import styles from './{{name.pascalCase}}.module.css'

export const {{name.pascalCase}} = () => {
  return <div className={styles.wrapper}>{{name.pascalCase}}</div>
}
```

## Опции

| Опция | Описание |
|-------|----------|
| `--overwrite` | Перезаписать существующие файлы |
| `--skip-update` | Не проверять обновления CLI |
| `--<переменная> <значение>` | Произвольная переменная шаблона |
