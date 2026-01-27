import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as https from 'https';
import * as readline from 'readline';
import { spawnSync } from 'child_process';
import ora = require('ora');
import { detectRunMode } from './runtime';

const PACKAGE_NAME = '@gromlab/create';
const UPDATE_TIMEOUT_MS = 2000;
const UPDATE_PROMPT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function getUpdateStatePath(): string {
  const xdgHome = process.env.XDG_CONFIG_HOME;
  if (xdgHome) {
    return path.join(xdgHome, 'gromlab-create', 'update.json');
  }
  const appData = process.env.APPDATA;
  if (appData) {
    return path.join(appData, 'gromlab-create', 'update.json');
  }
  return path.join(os.homedir(), '.gromlab-create', 'update.json');
}

function readDeclinedAt(): number | undefined {
  const statePath = getUpdateStatePath();
  try {
    const raw = fs.readFileSync(statePath, 'utf8');
    const data = JSON.parse(raw) as { declinedAt?: number };
    if (typeof data.declinedAt === 'number') return data.declinedAt;
  } catch {
    return undefined;
  }
  return undefined;
}

function writeDeclinedAt(timestamp: number) {
  const statePath = getUpdateStatePath();
  try {
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, JSON.stringify({ declinedAt: timestamp }), 'utf8');
  } catch {
    // ignore write errors
  }
}

function clearDeclinedAt() {
  const statePath = getUpdateStatePath();
  try {
    fs.unlinkSync(statePath);
  } catch {
    // ignore remove errors
  }
}

function readCurrentVersion(): string | undefined {
  try {
    const packageJsonPath = path.resolve(__dirname, '..', 'package.json');
    const raw = fs.readFileSync(packageJsonPath, 'utf8');
    const data = JSON.parse(raw) as { version?: string };
    return typeof data.version === 'string' ? data.version : undefined;
  } catch {
    return undefined;
  }
}

function parseSemver(version: string): number[] | null {
  const clean = version.split('+')[0].split('-')[0].trim();
  if (!clean) return null;
  const parts = clean.split('.').map((part) => Number(part));
  if (parts.some((value) => Number.isNaN(value))) return null;
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

function compareSemver(a: string, b: string): number {
  const aParts = parseSemver(a);
  const bParts = parseSemver(b);
  if (!aParts || !bParts) return 0;
  for (let i = 0; i < 3; i++) {
    if (aParts[i] > bParts[i]) return 1;
    if (aParts[i] < bParts[i]) return -1;
  }
  return 0;
}

function fetchLatestVersion(packageName: string, timeoutMs: number): Promise<string | undefined> {
  const encodedName = encodeURIComponent(packageName);
  const url = `https://registry.npmjs.org/${encodedName}/latest`;

  return new Promise((resolve) => {
    let settled = false;

    const finish = (value?: string) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const req = https.get(url, { headers: { Accept: 'application/json' } }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        finish();
        return;
      }

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data) as { version?: string };
          const version = typeof json.version === 'string' ? json.version : undefined;
          finish(version);
        } catch {
          finish();
        }
      });
    });

    req.on('error', () => finish());
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      finish();
    });
  });
}

function isInteractive(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

function askYesNo(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(['y', 'yes', 'д', 'да'].includes(normalized));
    });
  });
}

function runUpdate(packageName: string): boolean {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npmCmd, ['i', '-g', `${packageName}@latest`], { stdio: 'inherit' });
  if (result.error) {
    console.error(String(result.error));
    return false;
  }
  return result.status === 0;
}

function rerunCommand(args: string[]): never {
  const binName = process.platform === 'win32' ? 'gromlab-create.cmd' : 'gromlab-create';
  const result = spawnSync(binName, args, { stdio: 'inherit' });

  if (result.error) {
    const nodeResult = spawnSync(process.execPath, [process.argv[1], ...args], { stdio: 'inherit' });
    process.exit(nodeResult.status ?? 1);
  }

  process.exit(result.status ?? 0);
}

function hasSkipUpdateFlag(args: string[]): boolean {
  return args.some((arg) => arg === '--skip-update' || arg.startsWith('--skip-update='));
}

export async function maybeHandleUpdate(args: string[]): Promise<boolean> {
  if (detectRunMode() === 'npx') return true;
  if (hasSkipUpdateFlag(args)) return true;
  if (!isInteractive()) return true;

  const currentVersion = readCurrentVersion();
  if (!currentVersion) return true;

  const declinedAt = readDeclinedAt();
  if (declinedAt && Date.now() - declinedAt < UPDATE_PROMPT_COOLDOWN_MS) return true;

  const spinner = ora('Проверка обновлений...').start();

  const latestVersion = await fetchLatestVersion(PACKAGE_NAME, UPDATE_TIMEOUT_MS);
  if (!latestVersion) {
    spinner.stop();
    return true;
  }

  if (compareSemver(latestVersion, currentVersion) <= 0) {
    spinner.stop();
    return true;
  }

  spinner.succeed(`Доступна новая версия: ${currentVersion} → ${latestVersion}`);

  const shouldUpdate = await askYesNo('Обновить сейчас? [y/N] ');
  if (!shouldUpdate) {
    writeDeclinedAt(Date.now());
    return true;
  }

  const updateSpinner = ora('Обновление...').start();
  const updated = runUpdate(PACKAGE_NAME);
  if (!updated) {
    updateSpinner.fail('Не удалось обновить');
    return true;
  }

  updateSpinner.succeed('Обновлено');
  clearDeclinedAt();
  rerunCommand(args);
  return false;
}
