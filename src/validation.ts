import * as fs from 'fs';
import * as path from 'path';
import { collectTemplateVariables, listTemplateNames, readDirRecursive } from './templateUtils';
import { ParsedArgs, ValidationError, TemplateContext } from './types';

export function normalizeArgs(parsed: ParsedArgs): { normalized: ParsedArgs; error?: ValidationError } {
  const normalized: ParsedArgs = {
    ...parsed,
    vars: { ...parsed.vars },
    extra: [...parsed.extra]
  };

  if (!normalized.templateName) {
    return {
      normalized,
      error: {
        title: 'Требуется имя шаблона',
        showHelp: true
      }
    };
  }

  if (normalized.vars.name) {
    return {
      normalized,
      error: {
        title: 'Переменная name задается только позиционно',
        details: ['уберите --name и укажите <имя> после шаблона']
      }
    };
  }

  if (!normalized.positionalName) {
    return {
      normalized,
      error: {
        title: 'Требуется имя',
        details: ['укажите <имя> после шаблона'],
        showHelp: true
      }
    };
  }

  normalized.vars.name = normalized.positionalName;

  if (normalized.extra.length > 0) {
    return {
      normalized,
      error: {
        title: 'Неожиданные аргументы',
        details: normalized.extra
      }
    };
  }

  return { normalized };
}

export function resolveTemplateContext(
  templatesDir: string,
  templateName: string,
  vars: Record<string, string>
): { context?: TemplateContext; error?: ValidationError } {
  if (!fs.existsSync(templatesDir) || !fs.statSync(templatesDir).isDirectory()) {
    return {
      error: {
        title: 'Папка шаблонов не найдена',
        details: [templatesDir]
      }
    };
  }

  const availableTemplates = listTemplateNames(templatesDir);
  if (availableTemplates.length === 0) {
    return {
      error: {
        title: 'В папке шаблонов нет шаблонов'
      }
    };
  }

  if (!availableTemplates.includes(templateName)) {
    return {
      error: {
        title: `Шаблон не найден: ${templateName}`,
        details: availableTemplates,
        hint: 'Доступные шаблоны указаны выше'
      }
    };
  }

  const templateDir = path.join(templatesDir, templateName);
  const requiredVars = collectTemplateVariables(templateDir);
  const missingVars = Array.from(requiredVars).filter((name) => {
    const value = vars[name];
    return value === undefined || value.length === 0;
  });

  if (missingVars.length > 0) {
    return {
      error: {
        title: 'Не заданы переменные шаблона',
        details: missingVars.map((name) => `--${name} <value>`)
      }
    };
  }

  const files = readDirRecursive(templateDir);
  if (files.length === 0) {
    return {
      error: {
        title: 'Шаблон пустой'
      }
    };
  }

  return { context: { templateDir, files } };
}
