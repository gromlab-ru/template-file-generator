import { ParsedArgs } from './types';

export function printHelp() {
  const lines = [
    'Использование:',
    '  npx @gromlab/create <шаблон> <имя> [путь] [опции]',
    '',
    'Аргументы:',
    '  <шаблон>            Имя шаблона',
    '  <имя>               Значение переменной name (обязательный аргумент)',
    '  [путь]              Папка вывода (по умолчанию: текущая директория)',
    '',
    'Опции:',
    '  --<var> <value>      Переменная шаблона (поддерживается любой --key <value>)',
    '  --overwrite          Перезаписывать существующие файлы',
    '  --skip-update        Не проверять обновления CLI',
    '  -h, --help           Показать эту справку',
    '',
    'Примеры:',
    '  npx @gromlab/create component Button',
    '  npx @gromlab/create component Button src/components'
  ];
  console.log(lines.join('\n'));
}

function consumeValue(args: string[], index: number, key: string): string {
  const next = args[index + 1];
  if (!next || next.startsWith('-')) {
    throw new Error(`Missing value for --${key}`);
  }
  return next;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    vars: {},
    overwrite: false,
    skipUpdate: false,
    help: false,
    extra: []
  };
  const args = argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-h' || arg === '--help') {
      parsed.help = true;
      continue;
    }
    if (arg === '--overwrite') {
      parsed.overwrite = true;
      continue;
    }
    if (arg === '--skip-update') {
      parsed.skipUpdate = true;
      continue;
    }
    if (arg.startsWith('--')) {
      const eqIndex = arg.indexOf('=');
      const key = eqIndex === -1 ? arg.slice(2) : arg.slice(2, eqIndex);
      const inlineValue = eqIndex === -1 ? undefined : arg.slice(eqIndex + 1);

      if (!key) continue;

      if (key === 'templates' || key === 'templatesPath' || key === 'templates-path') {
        throw new Error('Опция --templates не поддерживается');
      }

      if (key === 'out' || key === 'output') {
        throw new Error('Опция --out не поддерживается');
      }

      const value = inlineValue ?? consumeValue(args, i, key);
      if (inlineValue === undefined) i++;
      parsed.vars[key] = value;
      continue;
    }

    if (!parsed.templateName) {
      parsed.templateName = arg;
      continue;
    }

    if (!parsed.positionalName) {
      parsed.positionalName = arg;
      continue;
    }

    if (!parsed.positionalOutDir) {
      parsed.positionalOutDir = arg;
      continue;
    }

    parsed.extra.push(arg);
  }

  return parsed;
}
