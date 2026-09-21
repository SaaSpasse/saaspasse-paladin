// Optional deployment smoke check. Credentials stay inside the Netlify build.
import { readFile } from 'node:fs/promises';

const target = process.env.FORGE_VERIFY_URL;
if (target) {
  const url = new URL(target);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/'
    || !(url.hostname === 'paladin.saaspasse.com' || /^[a-f0-9]+--saaspasse-paladin\.netlify\.app$/.test(url.hostname))) {
    throw new Error('Unexpected verification destination.');
  }
  if (!process.env.PALADIN_SECRET) throw new Error('Verification password is unavailable.');
  const source = JSON.parse(await readFile(new URL('../.netlify/private-editorials.json', import.meta.url), 'utf8'));
  async function request(route, options) {
    const response = await fetch(new URL(route, url), { ...options, redirect: 'error', signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`Deployment verification failed: HTTP ${response.status}`);
    if (!response.headers.get('cache-control')?.includes('no-store')) throw new Error('Private response is cacheable.');
    return response.json();
  }
  const login = await request('/.netlify/functions/validate-password', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: process.env.PALADIN_SECRET }),
  });
  if (login.valid !== true) throw new Error('Deployment login failed.');
  const headers = { 'X-Paladin-Secret': process.env.PALADIN_SECRET };
  const list = await request('/.netlify/functions/editoriaux', { headers });
  if (!Array.isArray(list) || list.length !== source.editorials.length) throw new Error('Deployed editorial list differs.');
  const filename = '2026-05-22-mele-sous-un-svelte-croissant.md';
  const article = await request(`/.netlify/functions/editorial-content?filename=${encodeURIComponent(filename)}`, { headers });
  if (article.content !== source.contents[filename]) throw new Error('Deployed editorial content differs.');
  console.log(`Authenticated deployment verified: login, ${list.length} editorials, corrected article, private caching.`);
}
