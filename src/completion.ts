import * as fs from 'fs';
import * as path from 'path';
import { collectTemplateVariables, listTemplateNames } from './templateUtils';
import { detectRunMode } from './runtime';

const BIN_NAMES = ['gromlab-create', 'create'];

function findNearestTemplatesDir(startDir: string): string | undefined {
  let current = path.resolve(startDir);
  while (true) {
    const candidate = path.join(current, '.templates');
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
        return candidate;
      }
    } catch {
      // ignore errors and keep walking up
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return undefined;
}

function listTemplates(cwd: string): string[] {
  const dir = findNearestTemplatesDir(cwd);
  try {
    if (!dir) return [];
    return listTemplateNames(dir);
  } catch {
    return [];
  }
}

function listTemplateVars(cwd: string, templateName: string): string[] {
  const root = findNearestTemplatesDir(cwd);
  if (!root) return [];
  const dir = path.join(root, templateName);
  try {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return [];
    const vars = Array.from(collectTemplateVariables(dir))
      .filter((name) => name !== 'name')
      .map((name) => `--${name}`)
      .sort();
    return vars;
  } catch {
    return [];
  }
}

function printLines(items: string[]) {
  if (items.length === 0) return;
  console.log(items.join('\n'));
}

function buildBashCompletion(): string {
  return [
    '# bash completion for gromlab-create',
    '',
    '_gromlab_create_list_templates() {',
    '  gromlab-create __list-templates --skip-update 2>/dev/null',
    '}',
    '',
    '_gromlab_create_list_vars() {',
    '  local template="$1"',
    '  if [[ -z "$template" ]]; then',
    '    return',
    '  fi',
    '  gromlab-create __list-vars "$template" --skip-update 2>/dev/null',
    '}',
    '',
    '_gromlab_create_completions() {',
    '  local cur="${COMP_WORDS[COMP_CWORD]}"',
    '  local cword=$COMP_CWORD',
    '  local template=""',
    '  local w',
    '  for ((i=1; i<${#COMP_WORDS[@]}; i++)); do',
    '    w="${COMP_WORDS[i]}"',
    '    if [[ "$w" == -* ]]; then',
    '      continue',
    '    fi',
    '    template="$w"',
    '    break',
    '  done',
    '',
    '  if [[ $cword -eq 1 ]]; then',
    '    COMPREPLY=( $(compgen -W "$(_gromlab_create_list_templates)" -- "$cur") )',
    '    return',
    '  fi',
    '',
    '  if [[ "$cur" == --* ]]; then',
    '    local opts="--overwrite --skip-update --help -h"',
    '    local vars=""',
    '    if [[ -n "$template" ]]; then',
    '      vars="$(_gromlab_create_list_vars "$template")"',
    '    fi',
    '    COMPREPLY=( $(compgen -W "$opts $vars" -- "$cur") )',
    '    return',
    '  fi',
    '',
    '  compopt -o default 2>/dev/null',
    '}',
    '',
    `complete -F _gromlab_create_completions ${BIN_NAMES.join(' ')}`,
    ''
  ].join('\n');
}

function buildZshCompletion(): string {
  return [
    '#compdef gromlab-create create',
    '',
    '_gromlab_create_list_templates() {',
    '  gromlab-create __list-templates --skip-update 2>/dev/null',
    '}',
    '',
    '_gromlab_create_list_vars() {',
    '  local template="$1"',
    '  if [[ -z "$template" ]]; then',
    '    return',
    '  fi',
    '  gromlab-create __list-vars "$template" --skip-update 2>/dev/null',
    '}',
    '',
    '_gromlab_create() {',
    '  local -a opts vars',
    '  local template=""',
    '  local w',
    '  for w in "${words[@]:1}"; do',
    '    if [[ "$w" == -* ]]; then',
    '      continue',
    '    fi',
    '    template="$w"',
    '    break',
    '  done',
    '',
    '  if (( CURRENT == 2 )); then',
    '    _values "templates" $(_gromlab_create_list_templates)',
    '    return',
    '  fi',
    '',
    '  if [[ "${words[CURRENT]}" == --* ]]; then',
    '    opts=(--overwrite --skip-update --help -h)',
    '    if [[ -n "$template" ]]; then',
    '      vars=($(_gromlab_create_list_vars "$template"))',
    '    else',
    '      vars=()',
    '    fi',
    '    _describe -t options "options" opts',
    '    _describe -t vars "vars" vars',
    '    return',
    '  fi',
    '',
    '  _files',
    '}',
    '',
    'compdef _gromlab_create gromlab-create create',
    ''
  ].join('\n');
}

function buildFishCompletion(): string {
  return [
    'function __gromlab_create_template',
    '  set -l tokens (commandline -opc)',
    '  for i in (seq 2 (count $tokens))',
    '    set -l token $tokens[$i]',
    '    if not string match -qr "^-" -- $token',
    '      echo $token',
    '      return',
    '    end',
    '  end',
    'end',
    '',
    'function __gromlab_create_list_templates',
    '  gromlab-create __list-templates --skip-update 2>/dev/null',
    'end',
    '',
    'function __gromlab_create_list_vars',
    '  set -l template (__gromlab_create_template)',
    '  if test -n "$template"',
    '    gromlab-create __list-vars $template --skip-update 2>/dev/null',
    '  end',
    'end',
    '',
    'for cmd in gromlab-create create',
    '  complete -c $cmd -n "__fish_use_subcommand" -a "(__gromlab_create_list_templates)"',
    '  complete -c $cmd -l overwrite -d "Перезаписывать существующие файлы"',
    '  complete -c $cmd -l skip-update -d "Не проверять обновления CLI"',
    '  complete -c $cmd -s h -l help -d "Справка"',
    '  complete -c $cmd -n "string match -qr \"^--\" (commandline -ct)" -a "(__gromlab_create_list_vars)"',
    'end',
    ''
  ].join('\n');
}

function resolveShell(args: string[]): string | undefined {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--shell' && args[i + 1]) return args[i + 1];
    if (arg.startsWith('--shell=')) return arg.slice('--shell='.length);
  }
  const candidate = args.find((arg) => !arg.startsWith('-'));
  return candidate;
}

function printCompletionUsage() {
  console.log('Использование:');
  console.log('  gromlab-create completion --shell <bash|zsh|fish>');
}

export function handleInternalCommand(args: string[], cwd: string = process.cwd()): boolean {
  if (args.length === 0) return false;
  const [command, ...rest] = args;

  if (command === '__list-templates') {
    printLines(listTemplates(cwd));
    return true;
  }

  if (command === '__list-vars') {
    const templateName = rest.find((arg) => !arg.startsWith('-'));
    if (templateName) {
      printLines(listTemplateVars(cwd, templateName));
    }
    return true;
  }

  if (command === 'completion') {
    if (detectRunMode() !== 'global') {
      console.error('Автодополнение доступно только для глобальной установки CLI.');
      process.exitCode = 1;
      return true;
    }

    const shell = resolveShell(rest);
    if (!shell) {
      printCompletionUsage();
      process.exitCode = 1;
      return true;
    }

    let normalized = shell.trim().toLowerCase();
    if (normalized === 'zh') normalized = 'zsh';
    let script = '';
    if (normalized === 'bash') script = buildBashCompletion();
    if (normalized === 'zsh') script = buildZshCompletion();
    if (normalized === 'fish') script = buildFishCompletion();

    if (!script) {
      console.error('Неизвестный shell. Доступно: bash, zsh, fish.');
      process.exitCode = 1;
      return true;
    }

    console.log(script);
    return true;
  }

  return false;
}
