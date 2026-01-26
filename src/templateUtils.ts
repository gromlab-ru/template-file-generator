import * as fs from 'fs';
import * as path from 'path';
import { camelCase, pascalCase, snakeCase, kebabCase, constantCase, upperCase, lowerCase } from 'change-case-all';

export const CASE_MODIFIERS: Record<string, (input: string) => string> = {
  pascalCase,
  camelCase,
  snakeCase,
  kebabCase,
  screamingSnakeCase: constantCase,
  upperCase,
  lowerCase,
  upperCaseAll: (value: string) => value.replace(/[-_\s]+/g, '').toUpperCase(),
  lowerCaseAll: (value: string) => value.replace(/[-_\s]+/g, '').toLowerCase()
};

const VARIABLE_PATTERN = /{{\s*([a-zA-Z0-9_]+)(?:\.([a-zA-Z0-9_]+))?\s*}}/g;

export function readDirRecursive(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...readDirRecursive(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

export function collectTemplateVariables(templateDir: string): Set<string> {
  const vars = new Set<string>();
  const files = readDirRecursive(templateDir);
  for (const file of files) {
    const relPath = path.relative(templateDir, file);
    {
      const pathRegex = /{{\s*([a-zA-Z0-9_]+)(?:\.[a-zA-Z0-9_]+)?\s*}}/g;
      let match: RegExpExecArray | null;
      while ((match = pathRegex.exec(relPath)) !== null) {
        vars.add(match[1]);
      }
    }
    {
      const content = fs.readFileSync(file, 'utf8');
      const contentRegex = /{{\s*([a-zA-Z0-9_]+)(?:\.[a-zA-Z0-9_]+)?\s*}}/g;
      let match: RegExpExecArray | null;
      while ((match = contentRegex.exec(content)) !== null) {
        vars.add(match[1]);
      }
    }
  }
  return vars;
}

export function renderTemplate(input: string, vars: Record<string, string>): string {
  return input.replace(VARIABLE_PATTERN, (_match, varName: string, modifier: string | undefined) => {
    const value = vars[varName];
    if (value === undefined) return '';
    if (modifier && CASE_MODIFIERS[modifier]) {
      return CASE_MODIFIERS[modifier](value);
    }
    return value;
  });
}

export function listTemplateNames(templatesDir: string): string[] {
  if (!fs.existsSync(templatesDir)) return [];
  const entries = fs.readdirSync(templatesDir, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}
