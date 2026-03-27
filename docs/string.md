# `@herowcode/utils/string`

String transformation, case conversion, formatting, and text processing utilities.

```typescript
import {
  capitalize,
  camelCase,
  kebabCase,
  snakeCase,
  slugify,
  truncate,
  toSentenceCase,
  removeHtmlTags,
  markdownToText,
  formatSecondsToHMS,
  formatSecondsToFragment,
  formatHMSToSeconds,
  formatStringToTime,
} from '@herowcode/utils/string';
```

---

## Case conversion

### `capitalize(str)`

Capitalizes the first letter and lowercases the rest.

```typescript
capitalize('hello world'); // → "Hello world"
capitalize('hELLO');       // → "Hello"
capitalize('');            // → ""
```

### `camelCase(str)`

Converts any string to camelCase.

```typescript
camelCase('hello world');  // → "helloWorld"
camelCase('hello-world');  // → "helloWorld"
camelCase('hello_world');  // → "helloWorld"
camelCase('HelloWorld');   // → "helloWorld"
```

### `kebabCase(str)`

Converts any string to kebab-case.

```typescript
kebabCase('Hello World');  // → "hello-world"
kebabCase('helloWorld');   // → "hello-world"
kebabCase('hello_world');  // → "hello-world"
```

### `snakeCase(str)`

Converts any string to snake_case.

```typescript
snakeCase('Hello World');  // → "hello_world"
snakeCase('helloWorld');   // → "hello_world"
snakeCase('hello-world');  // → "hello_world"
```

### `toSentenceCase(str)`

Converts a string to sentence case (first letter uppercase, rest lowercase).

```typescript
toSentenceCase('helloWorld');   // → "Hello world"
toSentenceCase('HELLO WORLD');  // → "Hello world"
```

---

## Text processing

### `slugify(text)`

Converts a string to a URL-friendly slug. Strips accents, replaces spaces with hyphens, and removes special characters.

```typescript
slugify('Hello World!');         // → "hello-world"
slugify('Olá Mundo');            // → "ola-mundo"
slugify('  Multiple   Spaces '); // → "multiple-spaces"
```

### `truncate(str, length, suffix?)`

Truncates a string to `length` visible characters and appends `suffix` (default `"..."`).

```typescript
truncate('Hello world', 5);          // → "He..."
truncate('Hello world', 5, '…');     // → "He…"
truncate('Hi', 10);                  // → "Hi"  (no truncation needed)
```

### `removeHtmlTags(input)`

Strips all HTML tags from a string.

```typescript
removeHtmlTags('<p>Hello <strong>world</strong></p>'); // → "Hello world"
removeHtmlTags('<img src="x" alt="image">');           // → ""
```

### `markdownToText(markdown)`

Converts Markdown to plain text, stripping all formatting while preserving content and sensible line breaks.

```typescript
markdownToText('# Hello **World**');           // → "Hello World"
markdownToText('[Click here](https://x.com)'); // → "Click here"
markdownToText('```js\nconsole.log("hi")\n```'); // → 'console.log("hi")'
markdownToText('> A blockquote');              // → "A blockquote"
```

Handles: headings, bold/italic, code blocks, inline code, links, images, HTML tags, blockquotes, lists, tables, footnotes, and horizontal rules.

---

## Time formatting

### `formatSecondsToHMS(totalSeconds)`

Formats a number of seconds into `HH:MM:SS` (or `MM:SS` if under an hour).

```typescript
formatSecondsToHMS(3661); // → "01:01:01"
formatSecondsToHMS(90);   // → "01:30"
formatSecondsToHMS(5);    // → "00:05"
formatSecondsToHMS(0);    // → "00:00"
```

### `formatSecondsToFragment(secs)`

Converts seconds to a YouTube-style timestamp fragment (e.g. `1h2m3s`).

```typescript
formatSecondsToFragment(3723); // → "1h2m3s"
formatSecondsToFragment(90);   // → "1m30s"
formatSecondsToFragment(42);   // → "42s"
formatSecondsToFragment(3600); // → "1h"
```

### `formatHMSToSeconds(val?)`

Converts an HMS string or numeric value to a total number of seconds. Returns `null` for invalid input.

```typescript
formatHMSToSeconds('1:30');    // → 90
formatHMSToSeconds('1:02:03'); // → 3723
formatHMSToSeconds('90');      // → 90
formatHMSToSeconds(120);       // → 120
formatHMSToSeconds(undefined); // → null
formatHMSToSeconds('abc');     // → null
```

### `formatStringToTime(str)`

Parses a digit-only string into `MM:SS` or `HH:MM:SS` format. Non-digit characters are stripped before formatting.

```typescript
formatStringToTime('123');   // → "01:23"
formatStringToTime('1234');  // → "12:34"
formatStringToTime('12345'); // → "01:23:45"
formatStringToTime('0');     // → "00:00"
```

---

[← Back to README](../README.md)
