# `@herowcode/utils/files`

File utilities with conditional browser/Node.js exports. Bundlers and Node.js resolve the correct entry automatically — no configuration needed.

```typescript
// Browser environment — gets browser-specific functions
import { compressImage, copyToClipboard, downloadBlob, downloadUrl, formatBytes, toCSV } from '@herowcode/utils/files';

// Node.js environment — gets server-specific functions
import { fileExists, fileDelete, formatBytes } from '@herowcode/utils/files';
```

Both entries export the same names. A function that does not exist in the current runtime throws (or rejects, for async ones) instead of silently doing nothing, e.g. `@herowcode/utils/files: fileExists is not supported in the browser`. This applies to `compressImage`, `copyToClipboard`, `downloadBlob` and `downloadUrl` in Node.js and to `fileExists` and `fileDelete` in the browser.

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

### `copyToClipboard(text)`

Copies text with `navigator.clipboard.writeText`, falling back to a hidden textarea and `document.execCommand("copy")` when the async API is missing or denied (insecure context, some iframes).

```typescript
if (await copyToClipboard(shareUrl)) {
  toast('Copied');
}
```

Invalid input returns: `false` (never throws) when both paths fail.

#### Replacing a local copy

Local copies typically try only `navigator.clipboard` and throw on HTTP pages; this resolves a boolean you can branch on. Call it from a user gesture (click) or browsers may refuse.

### `downloadBlob(blob, filename)`

Saves a `Blob` as `filename` through a temporary link, removed right away. The object URL is revoked about a second later so the download is not cancelled. `downloadUrl` uses the same code.

```typescript
downloadBlob(new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8' }), 'report.csv');
```

Invalid input returns: `false` (never throws) when the link cannot be created or clicked; returns `true` otherwise. Unlike `downloadUrl` it does not log.

#### Replacing a local copy

Replaces the `createObjectURL` + anchor + `click()` + `revokeObjectURL` boilerplate; the immediate-revoke variant fails in Safari and Firefox.

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

## Universal utilities

`toCSV` works in every runtime (browser, Node, edge) and is exported from both entries.

### `toCSV(rows, options?)`

Serializes rows to CSV following RFC 4180: fields containing the delimiter, a quote, CR or LF are quoted and quotes are doubled. Rows are arrays or plain objects; with objects the header row is the union of keys in first-seen order, and `headers` selects and orders the columns. There is no trailing line break.

```typescript
toCSV([{ name: 'Ana', note: 'a,b' }, { name: 'Bia', note: null }]);
// → 'name,note\r\nAna,"a,b"\r\nBia,'

toCSV([[1, 'x']], { headers: ['n', 's'], delimiter: ';', bom: true });
```

| Option | Default | Description |
|--------|---------|-------------|
| `headers` | none | Header labels; with object rows also the column keys, in order |
| `delimiter` | `","` | Field delimiter (use `";"` for Excel in pt-BR) |
| `eol` | `"\r\n"` | Record separator |
| `bom` | `false` | Prepend a UTF-8 BOM so Excel detects the encoding |
| `neutralizeFormulas` | `true` | Spreadsheet formula-injection guard, see below |

**Formula neutralization.** A string cell (or header) starting with `=`, `+`, `-`, `@`, tab or CR gets a leading `'` so spreadsheets do not execute it. `number` and `bigint` values are never touched, and strings matching `^[+-]?\d+(\.\d+)?$` (`"-12.5"`, `"+3"`) are exempt so plain numeric text stays numeric. Formatted pt-BR amounts such as `"-1.234,56"` or `"-R$ 12,50"` do not match, so they get the `'`; pass numbers (or `fromCents` values) instead of formatted strings, or set `neutralizeFormulas: false` for trusted data. Phone numbers like `"+55 11 99999-0000"` also get the prefix.

Cell values: `null` and `undefined` become empty fields, non-finite numbers and invalid dates become empty, dates use `toISOString()`, objects and arrays are JSON-encoded.

Invalid input returns: `""` for no rows (just the header row when `headers` is set); bad cell values become empty fields.

#### Replacing a local copy

Hand-written `rows.map((r) => r.join(','))` breaks on commas, quotes and line breaks and allows `=HYPERLINK(...)` injection. Differences to expect: `CRLF` line endings and the `'` prefix on formula-like text.

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
