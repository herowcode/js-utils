# `@herowcode/utils/files`

File utilities with conditional browser/Node.js exports. Bundlers and Node.js resolve the correct entry automatically — no configuration needed.

```typescript
// Browser environment — gets browser-specific functions
import { compressImage, downloadUrl, formatBytes } from '@herowcode/utils/files';

// Node.js environment — gets server-specific functions
import { fileExists, fileDelete, formatBytes } from '@herowcode/utils/files';
```

Both entries export the same names. A function that does not exist in the current runtime throws (or rejects, for async ones) instead of silently doing nothing, e.g. `@herowcode/utils/files: fileExists is not supported in the browser`. This applies to `compressImage` and `downloadUrl` in Node.js and to `fileExists` and `fileDelete` in the browser.

---

## Browser utilities

### `compressImage(options)`

Compresses an image file to WebP format using an offscreen canvas, with optional resizing. Returns a promise that rejects on an unsupported type, a read/decode failure, or a canvas error. The image is scaled down proportionally so that both `maxWidth` and `maxHeight` hold; it is never upscaled.

```typescript
const compressed = await compressImage({
  file: imageFile,          // File object from <input type="file">
  maxWidth: 1280,
  maxHeight: 720,
  quality: 0.85,            // 0–1, default 0.9
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
});

// compressed is a File object with .webp extension
console.log(compressed.name); // "photo.webp"
console.log(compressed.size); // smaller than original
```

| Option | Type | Description |
|--------|------|-------------|
| `file` | `File` | Source image file |
| `maxWidth` | `number` | Maximum output width in pixels |
| `maxHeight` | `number` | Maximum output height in pixels |
| `quality` | `number` | WebP compression quality (0–1) |
| `allowedFileTypes` | `string[]` | MIME types to accept; rejects if file type not listed |

---

### `downloadUrl(url)`

Triggers a file download in the browser by creating a temporary `<a>` element.

```typescript
const success = await downloadUrl('https://example.com/report.pdf');
// → true on success, false on failure
```

Returns `false` (and logs the error) on a non-2xx response, a network error, or a URL whose last path segment has no file extension. The filename is the percent-decoded last path segment. The anchor is removed right away and the object URL is revoked about a second later, so the download isn't cancelled.

---

### `formatBytes(bytes)`

Converts a byte count to a human-readable string.

```typescript
formatBytes(0);          // → "0 Bytes"
formatBytes(1024);       // → "1 KB"
formatBytes(1234567);    // → "1.18 MB"
formatBytes(1073741824); // → "1 GB"
```

---

## Node.js utilities

### `fileExists(filePath)`

Checks whether a file exists on the filesystem. Returns `true` if accessible, `false` otherwise — never throws.

```typescript
const exists = await fileExists('/tmp/upload.png');

if (exists) {
  // safe to read or process
}
```

---

### `fileDelete(filePath)`

Deletes a file with `fs.rm(path, { force: true })`. A missing file is not an error; any other failure (permissions, a directory, ...) is rethrown.

```typescript
await fileDelete('/tmp/upload.png');
// Resolves if the file is already gone; rejects on other errors such as EACCES
```

---

[← Back to README](../README.md)
