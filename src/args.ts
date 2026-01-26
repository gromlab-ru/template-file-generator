import { ParsedArgs } from './types';

export function printHelp() {
  const lines = [
    'Использование:',
    '  npx @gromlab/create <template> [name] [options]',
    '',
    'Опции:',
    '  --<var> <value>      Переменная шаблона (поддерживается любой --key <value>)',
    '  [name]               Сокращение для --name',
    '  --templates <path>   Папка шаблонов (по умолчанию: .templates)',
    '  --templates-path     Алиас для --templates',
    '  --out <path>         Папка вывода (по умолчанию: текущая директория)',
    '  --overwrite          Перезаписывать существующие файлы',
    '  --dry-run            Показать результат без записи на диск',
    '  -h, --help           Показать эту справку',
    '',
    'Примеры:',
    '  npx @gromlab/create component --name test',
    '  npx @gromlab/create component --name test --out src/components',
    '  npx @gromlab/create component --name test --templates /path/to/.templates'
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
    dryRun: false,
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
    if (arg === '--dry-run') {
      parsed.dryRun = true;
      continue;
    }

    if (arg.startsWith('--')) {
      const eqIndex = arg.indexOf('=');
      const key = eqIndex === -1 ? arg.slice(2) : arg.slice(2, eqIndex);
      const inlineValue = eqIndex === -1 ? undefined : arg.slice(eqIndex + 1);

      if (!key) continue;

      if (key === 'templates' || key === 'templatesPath' || key === 'templates-path') {
        const value = inlineValue ?? consumeValue(args, i, key);
        if (inlineValue === undefined) i++;
        parsed.templatesPath = value;
        continue;
      }

      if (key === 'out' || key === 'output') {
        const value = inlineValue ?? consumeValue(args, i, key);
        if (inlineValue === undefined) i++;
        parsed.outDir = value;
        continue;
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

    parsed.extra.push(arg);
  }

  return parsed;
}
