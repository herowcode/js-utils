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
camelCase('helloWorld');   // → "helloWorld"
camelCase('João Pessoa');  // → "joaoPessoa"
```

Accents are stripped (`ã` → `a`) and existing camelCase boundaries are kept as word breaks.

### `kebabCase(str)`

Converts any string to kebab-case.

```typescript
kebabCase('Hello World');  // → "hello-world"
kebabCase('helloWorld');   // → "hello-world"
kebabCase('hello_world');  // → "hello-world"
kebabCase('João Pessoa');  // → "joao-pessoa"
```

### `snakeCase(str)`

Converts any string to snake_case.

```typescript
snakeCase('Hello World');  // → "hello_world"
snakeCase('helloWorld');   // → "hello_world"
snakeCase('hello-world');  // → "hello_world"
snakeCase('João Pessoa');  // → "joao_pessoa"
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

Truncates a string to at most `length` characters, suffix included, appending `suffix` (default `"..."`). When `length` is shorter than the suffix, the suffix itself is cut to fit (`length` `0` returns `""`). Throws if `length` is negative, `NaN`, or infinite.

```typescript
truncate('Hello world', 5);          // → "He..."
truncate('Hello world', 5, '…');     // → "He…"
truncate('Hi', 10);                  // → "Hi"  (no truncation needed)
truncate('Hello world', 2);          // → ".."  (never exceeds length)
```

### `removeHtmlTags(input)`

Strips all HTML tags from a string in linear time. Only `<` followed by a letter, `/`, `!`, `?` or `>` starts a tag, so prose like `a < b and c > d` is left alone. Input longer than 100,000 characters is truncated to that length before stripping.

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

Intraword underscores (`my_variable_name`) are preserved; `_`/`__` only count as emphasis at word boundaries.

Handles: headings, bold/italic, code blocks, inline code, links, images, HTML tags, blockquotes, lists, tables, footnotes, and horizontal rules.

---

## Time formatting

### `formatSecondsToHMS(totalSeconds)`

Formats a number of seconds into `HH:MM:SS` (or `MM:SS` if under an hour). Negative and non-finite input (`NaN`, `±Infinity`) is treated as `0`.

```typescript
formatSecondsToHMS(3661); // → "01:01:01"
formatSecondsToHMS(90);   // → "01:30"
formatSecondsToHMS(5);    // → "00:05"
formatSecondsToHMS(0);    // → "00:00"
```

### `formatSecondsToFragment(secs)`

Converts seconds to a YouTube-style timestamp fragment (e.g. `1h2m3s`). Negative and non-finite input (`NaN`, `±Infinity`) is treated as `0`.

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

Parses a digit-only string into `MM:SS` (up to 4 digits) or `HH:MM:SS` (5 or more digits, first 6 used). Non-digit characters are stripped and leading zeros are kept as typed.

```typescript
formatStringToTime('123');   // → "01:23"
formatStringToTime('1234');  // → "12:34"
formatStringToTime('12345'); // → "01:23:45"
formatStringToTime('0');     // → "00:00"
formatStringToTime('000123'); // → "00:01:23"
```

---

[← Back to README](../README.md)
