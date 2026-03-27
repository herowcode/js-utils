# `@herowcode/utils/files`

File utilities with conditional browser/Node.js exports. Bundlers and Node.js resolve the correct entry automatically — no configuration needed.

```typescript
// Browser environment — gets browser-specific functions
import { compressImage, downloadUrl, formatBytes, getYoutubeThumbnail } from '@herowcode/utils/files';

// Node.js environment — gets server-specific functions
import { fileExists, fileDelete, formatBytes } from '@herowcode/utils/files';
```

---

## Browser utilities

### `compressImage(options)`

Compresses an image file to WebP format using an offscreen canvas, with optional resizing.

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
| `allowedFileTypes` | `string[]` | MIME types to accept; throws if file type not listed |

---

### `downloadUrl(url)`

Triggers a file download in the browser by creating a temporary `<a>` element.

```typescript
const success = await downloadUrl('https://example.com/report.pdf');
// → true on success, false on failure
```

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

Deletes a file. Errors are caught and logged — useful for cleanup tasks where failures should not interrupt execution.

```typescript
await fileDelete('/tmp/upload.png');
// If the file doesn't exist or deletion fails, it logs and continues
```

---

[← Back to README](../README.md)
