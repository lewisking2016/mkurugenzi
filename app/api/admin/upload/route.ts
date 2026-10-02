import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ApiError, fail, ok, requireAdmin } from '@/lib/server/resources';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Image uploads for the product editor.
 *
 * Files are written to `uploads/` at the project root and served back by the
 * `/uploads/<file>` route, which keeps them live immediately after a deploy
 * (`next start` only serves what was in `public/` at boot). No object storage
 * or extra service to run on cPanel or a VPS. The app user needs write access
 * to the `uploads` folder — see DEPLOYMENT.md.
 */

const MAX_BYTES = 8 * 1024 * 1024;

/** Extension comes from the sniffed MIME type, never from the uploaded filename. */
const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

/** `My Hoodie (2).PNG` -> `my-hoodie-2`; empty names fall back to `image`. */
function safeStem(name: string) {
  const stem = path.basename(name).replace(/\.[^.]+$/, '');
  const slug = stem
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48);
  return slug || 'image';
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new ApiError(400, 'Send the image as multipart/form-data under the "file" field.');
    }

    const file = form.get('file');
    if (!(file instanceof File)) throw new ApiError(400, 'No file was uploaded.');
    if (file.size === 0) throw new ApiError(400, 'That file is empty.');
    if (file.size > MAX_BYTES) throw new ApiError(413, 'Images must be 8 MB or smaller.');

    const ext = ALLOWED[file.type];
    if (!ext) throw new ApiError(415, 'Upload a JPEG, PNG, WebP, AVIF or GIF image.');

    const bytes = Buffer.from(await file.arrayBuffer());
    const unique = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const filename = `${safeStem(file.name)}-${unique}.${ext}`;

    const dir = path.join(process.cwd(), 'uploads');
    try {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, filename), bytes);
    } catch (error) {
      console.error('[upload]', error);
      throw new ApiError(
        500,
        'The uploads folder is not writable on this server. Check that the uploads directory exists and is writable by the app user.',
      );
    }

    return ok({ url: `/uploads/${filename}`, bytes: bytes.length }, 201);
  } catch (error) {
    return fail(error);
  }
}
