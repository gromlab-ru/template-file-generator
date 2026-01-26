import * as fs from 'fs';
import * as path from 'path';
import { renderTemplate } from './templateUtils';
import { PlanItem } from './types';

export function buildPlan(
  templateDir: string,
  outDir: string,
  vars: Record<string, string>,
  files: string[]
): PlanItem[] {
  return files.map((source) => {
    const relPath = path.relative(templateDir, source);
    const targetRelPath = renderTemplate(relPath, vars);
    if (!targetRelPath) {
      throw new Error(`Rendered path is empty for template file: ${relPath}`);
    }
    return {
      source,
      target: path.join(outDir, targetRelPath)
    };
  });
}

export function getTopLevelDirs(outDir: string, plan: PlanItem[]): string[] {
  const topLevelDirs = new Set<string>();
  for (const item of plan) {
    const relPath = path.relative(outDir, item.target);
    const parts = relPath.split(path.sep).filter(Boolean);
    if (parts.length > 1) {
      topLevelDirs.add(parts[0]);
    }
  }
  return Array.from(topLevelDirs);
}

export function getExistingDirs(outDir: string, topLevelDirs: string[]): string[] {
  return topLevelDirs.filter((dir) => {
    const fullPath = path.join(outDir, dir);
    return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
  });
}

export function getCollisions(plan: PlanItem[]): string[] {
  return plan
    .map((item) => item.target)
    .filter((target) => fs.existsSync(target));
}

export function getRoots(outDir: string, plan: PlanItem[]): string[] {
  const rootPaths = new Set<string>();
  for (const item of plan) {
    const relPath = path.relative(outDir, item.target);
    const parts = relPath.split(path.sep).filter(Boolean);
    if (parts.length <= 1) {
      rootPaths.add(outDir);
    } else {
      rootPaths.add(path.join(outDir, parts[0]));
    }
  }
  return Array.from(rootPaths);
}

export function writePlan(plan: PlanItem[], vars: Record<string, string>, overwrite: boolean) {
  for (const item of plan) {
    const content = fs.readFileSync(item.source, 'utf8');
    const rendered = renderTemplate(content, vars);
    fs.mkdirSync(path.dirname(item.target), { recursive: true });
    fs.writeFileSync(item.target, rendered, { flag: overwrite ? 'w' : 'wx' });
  }
}
