import * as fs from 'fs';
import * as path from 'path';
import archy = require('archy');
import chalk = require('chalk');
import directoryTree = require('directory-tree');
import figures = require('figures');
import { PlanItem } from './types';

type TreeNode = {
  name: string;
  children: Map<string, TreeNode>;
  isFile: boolean;
};

function buildTreeFromPaths(rootLabel: string, paths: string[]): string {
  const root: TreeNode = { name: rootLabel, children: new Map(), isFile: false };

  for (const rawPath of paths) {
    const parts = rawPath.split(path.sep).filter(Boolean);
    let current = root;
    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      let child = current.children.get(part);
      if (!child) {
        child = { name: part, children: new Map(), isFile: isLast };
        current.children.set(part, child);
      }
      if (isLast) {
        child.isFile = true;
      }
      current = child;
    });
  }

  const toArchyNode = (node: TreeNode): archy.Data => {
    const entries = Array.from(node.children.values()).sort((a, b) => a.name.localeCompare(b.name));
    const isDir = node.children.size > 0;
    return {
      label: isDir ? chalk.cyan(`${node.name}/`) : chalk.white(node.name),
      nodes: entries.map((child) => toArchyNode(child))
    };
  };

  return archy(toArchyNode(root));
}

function buildTreeFromDirectory(rootPath: string): string {
  const tree = directoryTree(rootPath, { attributes: ['type'] }) as directoryTree.DirectoryTree | null;
  if (!tree) return '';

  const toArchyNode = (node: directoryTree.DirectoryTree): archy.Data => {
    const nodes = (node.children ?? [])
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((child) => toArchyNode(child));
    const isDir = node.type === 'directory';
    const label = isDir ? chalk.cyan(`${node.name}/`) : chalk.white(node.name);
    return { label, nodes };
  };

  return archy(toArchyNode(tree));
}

export function printError(title: string, details?: string[], hint?: string) {
  console.error('');
  console.error(chalk.red(`${figures.cross}  ${title}`));
  if (details && details.length > 0) {
    console.error('');
    for (const detail of details) {
      console.error(chalk.red(`   ${figures.pointer} ${detail}`));
    }
  }
  if (hint) {
    console.error('');
    console.error(chalk.dim(`   ${figures.info}  ${hint}`));
  }
  console.error('');
}

function printRedLines(lines: string[]) {
  for (const line of lines) {
    console.log(chalk.red(line));
  }
}

export function printWarnings(redBlocks: string[][], blocks: string[][]) {
  if (redBlocks.length === 0 && blocks.length === 0) return;
  console.log('');
  console.log(chalk.yellow(`${figures.warning}  Предупреждения:`));
  for (const lines of redBlocks) {
    printRedLines(lines);
  }
  for (const lines of blocks) {
    for (const line of lines) {
      console.log(chalk.yellow(line));
    }
  }
}

function buildVariablesList(vars: Record<string, string>): string[] {
  const entries = Object.entries(vars);
  if (entries.length === 0) return [chalk.dim('  (нет)')];

  return entries.map(([key, value]) =>
    `  ${chalk.dim('--')}${chalk.blue(key)}${chalk.dim(':')} ${chalk.green(value)}`
  );
}

export function printSummary(
  plan: PlanItem[],
  outDir: string,
  vars: Record<string, string>,
  isDryRun: boolean,
  templateName: string,
  roots: string[]
) {
  const nameValue = vars.name;
  const displayName = nameValue ?? templateName;

  console.log('');

  // Заголовок с иконкой
  const statusIcon = isDryRun ? figures.info : figures.tick;
  const statusColor = isDryRun ? chalk.blue : chalk.green;
  const statusText = isDryRun ? 'Планируется генерация' : 'Успешно создан';

  console.log(statusColor(`${statusIcon}  ${statusText}: `) + chalk.bold.white(displayName));
  console.log('');

  // Путь/пути
  if (roots.length === 1) {
    console.log(chalk.dim('   Путь: ') + chalk.underline(roots[0]));
  } else if (roots.length > 1) {
    console.log(chalk.dim('   Пути:'));
    for (const rootPath of roots) {
      console.log(`     ${figures.pointer} ${chalk.underline(rootPath)}`);
    }
  }
  console.log('');

  // Дерево файлов
  console.log(chalk.dim('   Структура файлов:'));
  console.log('');

  if (roots.length === 0) {
    console.log(chalk.dim('  (пусто)'));
  } else {
    for (const rootPath of roots) {
      const treeOutput = (!isDryRun && fs.existsSync(rootPath))
        ? buildTreeFromDirectory(rootPath)
        : buildTreeFromPaths(path.basename(rootPath) || rootPath, plan
            .map((item) => path.relative(rootPath, item.target))
            .filter((rel) => rel && !rel.startsWith('..')));

      // Добавляем отступ к дереву
      const indentedTree = treeOutput
        .trimEnd()
        .split('\n')
        .map(line => '   ' + line)
        .join('\n');
      console.log(indentedTree);

      if (roots.length > 1) {
        console.log('');
      }
    }
  }
  console.log('');

  // Переменные
  console.log(chalk.dim('   Переменные:'));
  const varsLines = buildVariablesList(vars);
  for (const line of varsLines) {
    console.log(' ' + line);
  }
  console.log('');
}
