#!/usr/bin/env node
import * as path from 'path';
import { parseArgs, printHelp } from './args';
import { printError, printWarnings, printSummary } from './output';
import { PlanItem } from './types';
import { normalizeArgs, resolveTemplateContext } from './validation';
import { buildPlan, getCollisions, getExistingDirs, getRoots, getTopLevelDirs, writePlan } from './plan';
import { maybeHandleUpdate } from './update';
import { handleInternalCommand } from './completion';

function resolvePath(baseDir: string, inputPath: string): string {
  if (path.isAbsolute(inputPath)) return path.normalize(inputPath);
  return path.resolve(baseDir, inputPath);
}

async function run() {
  const args = process.argv.slice(2);
  if (handleInternalCommand(args)) return;

  const shouldContinue = await maybeHandleUpdate(args);
  if (!shouldContinue) {
    return;
  }

  let parsed;
  try {
    parsed = parseArgs(process.argv);
  } catch (error) {
    console.error(String(error));
    process.exitCode = 1;
    return;
  }

  if (parsed.help) {
    printHelp();
    return;
  }

  const normalizedResult = normalizeArgs(parsed);
  if (normalizedResult.error) {
    printError(normalizedResult.error.title, normalizedResult.error.details, normalizedResult.error.hint);
    if (normalizedResult.error.showHelp) {
      printHelp();
    }
    process.exitCode = 1;
    return;
  }
  const normalized = normalizedResult.normalized;

  const cwd = process.cwd();
  const templatesDir = resolvePath(cwd, '.templates');
  const outDir = resolvePath(cwd, normalized.positionalOutDir ?? '.');

  const templateResult = resolveTemplateContext(
    templatesDir,
    normalized.templateName!,
    normalized.vars
  );
  if (templateResult.error) {
    printError(templateResult.error.title, templateResult.error.details, templateResult.error.hint);
    process.exitCode = 1;
    return;
  }
  const templateContext = templateResult.context!;
  const plan: PlanItem[] = buildPlan(templateContext.templateDir, outDir, normalized.vars, templateContext.files);
  const topLevelDirs = getTopLevelDirs(outDir, plan);
  const existingDirs = getExistingDirs(outDir, topLevelDirs);

  const redWarnings: string[][] = [];

  if (existingDirs.length > 0) {
    if (!normalized.overwrite) {
      printError(
        'Папка назначения уже существует',
        existingDirs.map((dir) => path.join(outDir, dir)),
        'Используйте --overwrite для перезаписи'
      );
      process.exitCode = 1;
      return;
    }
    const warningLines = [
      'Папка назначения уже существует:',
      ...existingDirs.map((dir) => `  - ${path.join(outDir, dir)}`),
      'Используйте --overwrite для перезаписи.'
    ];
    redWarnings.push(warningLines);
  }

  if (existingDirs.length === 0) {
    const collisions = getCollisions(plan);

    if (collisions.length > 0 && !normalized.overwrite) {
      printError(
        'Файлы уже существуют',
        collisions.map((target) => path.relative(outDir, target)),
        'Используйте --overwrite для перезаписи'
      );
      process.exitCode = 1;
      return;
    }
  }

  const roots = getRoots(outDir, plan);

  writePlan(plan, normalized.vars, normalized.overwrite);

  printSummary(plan, outDir, normalized.vars, normalized.templateName!, roots);
  printWarnings(redWarnings, []);
}

run().catch((error) => {
  console.error(String(error));
  process.exitCode = 1;
});
