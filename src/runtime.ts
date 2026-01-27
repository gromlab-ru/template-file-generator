import * as path from 'path';

export type RunMode = 'npx' | 'local' | 'direct' | 'global';

function hasPathSegment(input: string, segment: string): boolean {
  const sep = path.sep;
  const altSep = sep === '/' ? '\\' : '/';
  const pattern = `${sep}${segment}${sep}`;
  const altPattern = `${altSep}${segment}${altSep}`;
  return input.includes(pattern) || input.includes(altPattern);
}

function isNpxInvocation(argv1: string, env: NodeJS.ProcessEnv): boolean {
  const npmCommand = env.npm_command ?? '';
  const npmExecPath = env.npm_execpath ?? '';

  if (hasPathSegment(argv1, '_npx')) return true;
  if (npmCommand === 'exec') return true;
  if (npmExecPath.includes('npx-cli.js')) return true;

  return false;
}

function isLocalInvocation(argv1: string): boolean {
  return hasPathSegment(argv1, 'node_modules') && hasPathSegment(argv1, '.bin');
}

function isDirectInvocation(argv0: string, argv1: string): boolean {
  if (!argv0 || !argv1) return false;
  const base = path.basename(argv0).toLowerCase();
  const isNode = base === 'node' || base === 'node.exe';
  if (!isNode) return false;
  const resolvedArgv1 = path.resolve(argv1);
  const localDist = path.resolve(process.cwd(), 'dist', 'cli.js');
  return resolvedArgv1 === localDist;
}

export function detectRunMode(argv: string[] = process.argv, env: NodeJS.ProcessEnv = process.env): RunMode {
  const argv0 = argv[0] ?? '';
  const argv1 = argv[1] ?? '';

  if (isNpxInvocation(argv1, env)) return 'npx';
  if (isLocalInvocation(argv1)) return 'local';
  if (isDirectInvocation(argv0, argv1)) return 'direct';
  return 'global';
}

export function isGlobalInvocation(argv: string[] = process.argv, env: NodeJS.ProcessEnv = process.env): boolean {
  return detectRunMode(argv, env) === 'global';
}
