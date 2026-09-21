import assert from 'node:assert/strict';
import { beforeEach, after, test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const temp = await mkdtemp(path.join(tmpdir(), 'paladin-access-test-'));
const savedSecret = process.env.PALADIN_SECRET;
const savedFetch = globalThis.fetch;
const secret = 'test-only-paladin-password';
const filename = '2026-05-29-le-vc-au-que\u0301bec.md';
const editorial = { filename, date: '2026-05-29', title: 'Le VC au Québec', slug: 'le-vc-au-que\u0301bec' };
const content = 'Private editorial fixture';

await build({
  entryPoints: ['netlify/functions/editoriaux.ts', 'netlify/functions/editorial-content.ts', 'netlify/functions/validate-password.ts'],
  outdir: temp,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outExtension: { '.js': '.cjs' },
  plugins: [{
    name: 'private-editorial-fixture',
    setup(build) {
      build.onResolve({ filter: /editorial-store$/ }, () => ({ path: 'store', namespace: 'fixture' }));
      build.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: `
        export async function getEditorialStore() {
          globalThis.__editorialStoreReads++;
          if (globalThis.__editorialStoreError) throw new Error('Private storage failure details');
          return ${JSON.stringify({ editorials: [editorial], contents: { [filename]: content } })};
        }
      ` }));
    },
  }],
});

const { handler: list } = await import(pathToFileURL(path.join(temp, 'editoriaux.cjs')));
const { handler: read } = await import(pathToFileURL(path.join(temp, 'editorial-content.cjs')));
const { handler: login } = await import(pathToFileURL(path.join(temp, 'validate-password.cjs')));

function event({ password = secret, method = 'GET', query = { filename } } = {}) {
  return {
    httpMethod: method,
    headers: password === null ? {} : { 'x-paladin-secret': password },
    queryStringParameters: query,
  };
}

function assertPrivate(response, status) {
  assert.equal(response.statusCode, status);
  assert.equal(response.headers['Cache-Control'], 'private, no-store');
  assert.equal(response.headers['CDN-Cache-Control'], 'no-store');
  assert.equal(response.headers['Netlify-CDN-Cache-Control'], 'no-store');
  assert.equal(response.headers.Vary, 'X-Paladin-Secret');
  assert.equal(response.headers['Content-Type'], 'application/json');
}

beforeEach(() => {
  process.env.PALADIN_SECRET = secret;
  globalThis.__editorialStoreReads = 0;
  globalThis.__editorialStoreError = false;
  globalThis.fetch = async () => { throw new Error('Unexpected network request'); };
});

after(async () => {
  if (savedSecret === undefined) delete process.env.PALADIN_SECRET;
  else process.env.PALADIN_SECRET = savedSecret;
  globalThis.fetch = savedFetch;
  delete globalThis.__editorialStoreReads;
  delete globalThis.__editorialStoreError;
  await rm(temp, { recursive: true, force: true });
});

test('anonymous and wrong-password requests cannot read either private source', async () => {
  for (const handler of [list, read]) {
    for (const password of [null, '', 'incorrect', 'test-only-paladin-passworD']) {
      const response = await handler(event({ password }));
      assertPrivate(response, 401);
      assert.ok(!response.body.includes(content));
    }
  }
  assert.equal(globalThis.__editorialStoreReads, 0);
});

test('missing server configuration fails closed even with a presented password', async () => {
  delete process.env.PALADIN_SECRET;
  for (const handler of [list, read]) assertPrivate(await handler(event()), 503);
  assert.equal(globalThis.__editorialStoreReads, 0);
});

test('authenticated callers can list and read an editorial with its exact Unicode filename', async () => {
  const index = await list(event());
  assertPrivate(index, 200);
  assert.deepEqual(JSON.parse(index.body), [editorial]);
  const article = await read(event());
  assertPrivate(article, 200);
  assert.deepEqual(JSON.parse(article.body), { content });
});

test('path traversal, encoded separators and URL fragments are rejected before reading data', async () => {
  for (const invalid of [
    '../README.md', '2026-05-29-../../README.md', '2026-05-29-test/secret.md',
    '2026-05-29-test\\secret.md', '2026-05-29-test%2fsecret.md',
    '2026-05-29-test%252fsecret.md', '2026-05-29-test?secret.md',
    '2026-05-29-test#secret.md', '2026-05-29-test..md',
    '2026-05-29-test\u0000.md', '2026-05-29-test.md\n', '2026-05-29-test.md\u2028',
    '2026-05-29-' + 'a'.repeat(256) + '.md',
  ]) assertPrivate(await read(event({ query: { filename: invalid } })), 400);
  assertPrivate(await read(event({ query: {} })), 400);
  assert.equal(globalThis.__editorialStoreReads, 0);
});

test('unsupported methods and missing content remain private and uncacheable', async () => {
  for (const handler of [list, read]) assertPrivate(await handler(event({ method: 'POST' })), 405);
  assert.equal(globalThis.__editorialStoreReads, 0);
  assertPrivate(await read(event({ query: { filename: '2026-01-01-absent.md' } })), 404);
});

test('storage failures do not expose internal details and remain uncacheable', async () => {
  globalThis.__editorialStoreError = true;
  for (const handler of [list, read]) {
    const response = await handler(event());
    assertPrivate(response, 503);
    assert.ok(!response.body.includes('Private storage failure details'));
  }
});

test('login validates only the shared password and never calls Gemini', async () => {
  const valid = await login({ ...event({ method: 'POST' }), body: JSON.stringify({ password: secret }) });
  assertPrivate(valid, 200);
  assert.deepEqual(JSON.parse(valid.body), { valid: true });
  const invalid = await login({ ...event({ method: 'POST' }), body: JSON.stringify({ password: 'incorrect' }) });
  assertPrivate(invalid, 401);
  assert.equal(JSON.parse(invalid.body).valid, false);
  assertPrivate(await login({ ...event({ method: 'POST' }), body: '{' }), 400);
  delete process.env.PALADIN_SECRET;
  assertPrivate(await login({ ...event({ method: 'POST' }), body: JSON.stringify({ password: secret }) }), 503);
});
