import { execFile } from 'node:child_process';
import { chmod, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const repository = 'git@github.com:SaaSpasse/saaspasse-editoriaux.git';
const snapshotRelativePath = '.netlify/private-editorials.json';
const filenamePattern = /^\d{4}-\d{2}-\d{2}-[^/\\\u0000-\u001f\u007f]+\.md$/u;

function titleFromFrontmatter(text, slug) {
  const frontmatter = text.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  const title = frontmatter?.[1].match(/^title:\s*(.+)$/m)?.[1].trim();
  if (title?.startsWith('"') && title.endsWith('"')) {
    try { return JSON.parse(title); } catch { throw new Error('Invalid quoted editorial title.'); }
  }
  if (title?.startsWith("'") && title.endsWith("'")) return title.slice(1, -1).replaceAll("''", "'");
  if (title) return title;
  const words = slug.replaceAll('-', ' ');
  return words.charAt(0).toLocaleUpperCase('fr-FR') + words.slice(1);
}

async function regularFileText(filename) {
  if (!(await lstat(filename)).isFile()) throw new Error('Editorial sources must be regular files.');
  return readFile(filename, 'utf8');
}

export async function collectEditorials(sourceDir) {
  const root = await realpath(sourceDir);
  for (const directory of ['editoriaux', 'posts-complets']) {
    if (!(await lstat(path.join(root, directory))).isDirectory()) {
      throw new Error('Editorial source directories must be real directories.');
    }
  }
  const files = await readdir(path.join(root, 'editoriaux'), { withFileTypes: true });
  const editorials = [];
  const contents = Object.create(null);
  for (const entry of files) {
    if (!entry.name.endsWith('.md')) continue;
    if (!entry.isFile() || !filenamePattern.test(entry.name)) throw new Error('Invalid editorial filename or symlink.');
    const filename = entry.name;
    const date = filename.slice(0, 10);
    const slug = filename.slice(11, -3);
    const content = await regularFileText(path.join(root, 'editoriaux', filename));
    if (!content.trim()) throw new Error('An editorial source is empty.');
    const fullPost = await regularFileText(path.join(root, 'posts-complets', filename));
    const title = titleFromFrontmatter(fullPost, slug);
    if (typeof title !== 'string' || !title.trim()) throw new Error('Invalid editorial title.');
    editorials.push({ filename, date, title, slug });
    contents[filename] = content;
  }
  if (!editorials.length) throw new Error('The editorial source contains no editorials.');
  editorials.sort((a, b) => b.date.localeCompare(a.date) || a.filename.localeCompare(b.filename, 'fr'));
  return { editorials, contents };
}

const shellQuote = (value) => `'${value.replaceAll("'", "'\\''")}'`;

async function clonePrivateEditorials(tempRoot, env) {
  const key = env.EDITORIALS_DEPLOY_KEY?.trim();
  const hosts = env.EDITORIALS_KNOWN_HOSTS?.trim();
  if (!key || !hosts) throw new Error('EDITORIALS_DEPLOY_KEY and EDITORIALS_KNOWN_HOSTS are required for the build.');
  if (!/^-----BEGIN OPENSSH PRIVATE KEY-----\r?\n[\s\S]+\r?\n-----END OPENSSH PRIVATE KEY-----$/.test(key)) {
    throw new Error('EDITORIALS_DEPLOY_KEY must contain a complete OpenSSH private key.');
  }
  if (!hosts.split(/\r?\n/).some((line) => /^github\.com\s+(?:ssh-ed25519|ssh-rsa|ecdsa-sha2-nistp256)\s+[A-Za-z0-9+/]+={0,3}(?:\s|$)/.test(line))) {
    throw new Error('EDITORIALS_KNOWN_HOSTS must pin a GitHub host key.');
  }
  const keyFile = path.join(tempRoot, 'deploy-key');
  const hostsFile = path.join(tempRoot, 'known_hosts');
  await writeFile(keyFile, `${key}\n`, { mode: 0o600 });
  await writeFile(hostsFile, `${hosts}\n`, { mode: 0o600 });
  const cloneDir = path.join(tempRoot, 'editorials');
  const cloneEnv = {
    ...env,
    GIT_TERMINAL_PROMPT: '0',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_SSH_COMMAND: `ssh -F /dev/null -i ${shellQuote(keyFile)} -o IdentitiesOnly=yes -o IdentityAgent=none -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=${shellQuote(hostsFile)} -o GlobalKnownHostsFile=/dev/null`,
  };
  delete cloneEnv.EDITORIALS_DEPLOY_KEY;
  delete cloneEnv.EDITORIALS_KNOWN_HOSTS;
  try {
    await run('git', ['-c', 'core.hooksPath=/dev/null', 'clone', '--quiet', '--depth', '1', '--single-branch', '--branch', 'main', repository, cloneDir], {
      env: cloneEnv, timeout: 60_000, maxBuffer: 1024 * 1024,
    });
  } catch {
    throw new Error('Unable to fetch the private editorial source. Check the deploy key and pinned GitHub host keys.');
  }
  return cloneDir;
}

export async function prepareEditorials({ sourceDir, root = projectRoot, env = process.env } = {}) {
  const snapshotFile = path.join(root, snapshotRelativePath);
  const pendingFile = `${snapshotFile}.tmp`;
  // A failed build must never reuse an earlier successful snapshot.
  await rm(snapshotFile, { force: true });
  await rm(pendingFile, { force: true });
  let temporaryDirectory;
  try {
    const explicitSource = sourceDir || env.EDITORIALS_SOURCE_DIR;
    if (explicitSource && env.NETLIFY === 'true') {
      throw new Error('Local editorial sources are disabled in Netlify builds.');
    }
    let source = explicitSource;
    if (!source) {
      temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'paladin-editorials-'));
      await chmod(temporaryDirectory, 0o700);
      source = await clonePrivateEditorials(temporaryDirectory, env);
    }
    const snapshot = await collectEditorials(source);
    await mkdir(path.dirname(snapshotFile), { recursive: true });
    await writeFile(pendingFile, `${JSON.stringify(snapshot)}\n`, { mode: 0o600 });
    await rename(pendingFile, snapshotFile);
    return snapshot;
  } catch (error) {
    await rm(snapshotFile, { force: true });
    await rm(pendingFile, { force: true });
    throw error;
  } finally {
    if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== '--source-dir' || !args[1])) {
    console.error('Usage: node scripts/prepare-editorials.mjs [--source-dir /explicit/local/repository]');
    process.exitCode = 1;
  } else {
    try {
      const snapshot = await prepareEditorials({ sourceDir: args[1] });
      console.log(`Prepared ${snapshot.editorials.length} editorials for authenticated server functions.`);
    } catch (error) {
      console.error(`Editorial preparation failed: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
