// Программный API для @gromlab/template-file-generator
// CLI точка входа остаётся в cli.ts (bin)

// Генерация
export { buildPlan, writePlan, getCollisions, getExistingDirs, getTopLevelDirs, getRoots } from './plan';

// Шаблоны
export {
  renderTemplate,
  collectTemplateVariables,
  readDirRecursive,
  listTemplateNames,
  findNearestTemplatesDir,
  CASE_MODIFIERS,
} from './templateUtils';

// Валидация
export { resolveTemplateContext, normalizeArgs } from './validation';

// Типы
export type { PlanItem, TemplateContext, ValidationError, ParsedArgs } from './types';
