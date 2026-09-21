import { readFile } from 'node:fs/promises';
import path from 'node:path';

export interface Editorial {
  filename: string;
  date: string;
  title: string;
  slug: string;
}

export interface EditorialStore {
  editorials: Editorial[];
  contents: Record<string, string>;
}

let store: Promise<EditorialStore> | undefined;

async function loadEditorialStore(): Promise<EditorialStore> {
  // included_files preserves this path in each Netlify function bundle.
  const filename = path.join(process.env.LAMBDA_TASK_ROOT || process.cwd(), '.netlify', 'private-editorials.json');
  const data = JSON.parse(await readFile(filename, 'utf8')) as EditorialStore;
  if (!Array.isArray(data.editorials) || !data.editorials.length || !data.contents || typeof data.contents !== 'object') {
    throw new Error('The private editorial snapshot is invalid.');
  }
  for (const editorial of data.editorials) {
    if (!editorial || ['filename', 'date', 'title', 'slug'].some((key) => typeof editorial[key as keyof Editorial] !== 'string')
      || !Object.hasOwn(data.contents, editorial.filename) || typeof data.contents[editorial.filename] !== 'string') {
      throw new Error('The private editorial snapshot is invalid.');
    }
  }
  return data;
}

export async function getEditorialStore(): Promise<EditorialStore> {
  store ??= loadEditorialStore().catch((error) => {
    store = undefined;
    throw error;
  });
  return store;
}
