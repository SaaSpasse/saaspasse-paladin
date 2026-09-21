import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { collectEditorials, prepareEditorials } from '../scripts/prepare-editorials.mjs';

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'editorial-source-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = path.join(root, 'source');
  await mkdir(path.join(source, 'editoriaux'), { recursive: true });
  await mkdir(path.join(source, 'posts-complets'));
  const add = async (filename, title, content = 'Private editorial fixture.\n') => {
    await writeFile(path.join(source, 'editoriaux', filename), content);
    await writeFile(path.join(source, 'posts-complets', filename), `---\ntitle: ${title}\n---\nFull post.\n`);
  };
  return { root, source, add };
}

test('builds a sorted private snapshot while retaining Unicode filenames and titles', async (t) => {
  const { root, source, add } = await fixture(t);
  const filename = '2026-05-29-le-vc-au-que\u0301bec.md';
  await add('2026-01-02-first.md', "'L''ancien texte'");
  await add(filename, '"Le VC au Québec 🚀"', 'Unicode filename content.\n');
  const snapshot = await prepareEditorials({ sourceDir: source, root, env: {} });
  assert.equal(snapshot.editorials[0].filename, filename);
  assert.equal(snapshot.editorials[0].title, 'Le VC au Québec 🚀');
  assert.equal(snapshot.editorials[1].title, "L'ancien texte");
  assert.equal(snapshot.contents[filename], 'Unicode filename content.\n');
  assert.deepEqual(JSON.parse(await readFile(path.join(root, '.netlify/private-editorials.json'), 'utf8')), JSON.parse(JSON.stringify(snapshot)));
  await assert.rejects(readFile(path.join(root, 'dist/private-editorials.json')), { code: 'ENOENT' });
  await assert.rejects(readFile(path.join(root, 'public/private-editorials.json')), { code: 'ENOENT' });
});

test('fails closed and removes an old snapshot when credentials are missing', async (t) => {
  const { root } = await fixture(t);
  await mkdir(path.join(root, '.netlify'));
  await writeFile(path.join(root, '.netlify/private-editorials.json'), '{"stale":true}');
  await assert.rejects(prepareEditorials({ root, env: {} }), /DEPLOY_KEY.*KNOWN_HOSTS/);
  await assert.rejects(readFile(path.join(root, '.netlify/private-editorials.json')), { code: 'ENOENT' });
});

test('rejects the explicit local override in hosted Netlify builds', async (t) => {
  const { root, source } = await fixture(t);
  await assert.rejects(prepareEditorials({ sourceDir: source, root, env: { NETLIFY: 'true' } }), /disabled in Netlify/);
  await assert.rejects(prepareEditorials({ root, env: { NETLIFY: 'true', EDITORIALS_SOURCE_DIR: source } }), /disabled in Netlify/);
});

test('does not bundle symlinks or empty editorial sources', async (t) => {
  const { source, add } = await fixture(t);
  const filename = '2026-01-02-editorial.md';
  await add(filename, 'A title', '');
  await assert.rejects(collectEditorials(source), /empty/);
  await rm(path.join(source, 'editoriaux', filename));
  await symlink(path.join(source, 'posts-complets', filename), path.join(source, 'editoriaux', filename));
  await assert.rejects(collectEditorials(source), /symlink/);
});

test('fails for a source with no editorials and for missing paired posts', async (t) => {
  const { source } = await fixture(t);
  await assert.rejects(collectEditorials(source), /no editorials/);
  await writeFile(path.join(source, 'editoriaux/2026-01-02-editorial.md'), 'Content.');
  await assert.rejects(collectEditorials(source), { code: 'ENOENT' });
});
