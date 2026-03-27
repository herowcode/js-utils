# `@herowcode/utils/array`

Array manipulation and text processing utilities.

```typescript
import { shuffle, unique, markdownToText } from '@herowcode/utils/array';
```

---

## `shuffle<T>(array)`

Returns a new array with elements in random order. Does not mutate the original.

```typescript
shuffle([1, 2, 3, 4, 5]);
// → [3, 1, 5, 2, 4]  (random)

shuffle(['a', 'b', 'c']);
// → ['c', 'a', 'b']  (random)
```

---

## `unique<T>(array)`

Removes duplicate values. Preserves the first occurrence and original order.

```typescript
unique([1, 2, 2, 3, 1, 4]);
// → [1, 2, 3, 4]

unique(['apple', 'banana', 'apple', 'cherry']);
// → ['apple', 'banana', 'cherry']
```

---

## `markdownToText(markdown)`

Converts a Markdown string to plain text, stripping all formatting.

```typescript
markdownToText('# Hello **World**');
// → 'Hello World'

markdownToText('[Click here](https://example.com)');
// → 'Click here'

markdownToText('```js\nconsole.log("hi")\n```');
// → 'console.log("hi")'
```

Handles: headings, bold, italic, code blocks, inline code, links, images, HTML tags, blockquotes, lists, tables, footnotes, and horizontal rules.

> **Note:** `markdownToText` is also exported from `@herowcode/utils/string`.

---

[← Back to README](../README.md)
