# `@herowcode/utils/string`

String transformation, case conversion, formatting, and text processing utilities.

```typescript
import {
  capitalize,
  camelCase,
  kebabCase,
  snakeCase,
  slugify,
  removeAccents,
  normalizeText,
  getInitials,
  escapeHtml,
  escapeRegExp,
  pluralize,
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

### `slugify(text, options?)`

Converts a string to a URL-friendly slug. Strips accents, replaces spaces with hyphens, and removes special characters.

```typescript
slugify('Hello World!');         // → "hello-world"
slugify('Olá Mundo');            // → "ola-mundo"
slugify('  Multiple   Spaces '); // → "multiple-spaces"
slugify('Olá Mundo', { separator: '_' });             // → "ola_mundo"
slugify('hello brave world', { maxLength: 7 });       // → "hello-b"
```

| Option | Default | Description |
|--------|---------|-------------|
| `separator` | `"-"` | String that joins the words |
| `maxLength` | none | Cuts the slug to at most this many characters, never leaving a trailing separator |

### `removeAccents(text)`

Strips diacritics via NFD decomposition. Case and punctuation are kept.

```typescript
removeAccents('Crème Brûlée'); // → "Creme Brulee"
```

### `normalizeText(text)`

Lowercases, strips accents and punctuation, and collapses whitespace to single spaces. Use it to compare or search text; `slugify` is `normalizeText` with spaces turned into hyphens.

```typescript
normalizeText('  Olá,   Mundo! '); // → "ola mundo"
```

Invalid input returns: not applicable, blank input returns `""`.

### Replacing a local copy

A local `str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")` is `removeAccents`. Characters outside `[A-Za-z0-9_]` and whitespace (for example CJK) are dropped by `normalizeText`, as `slugify` already does.

### `getInitials(name, options?)`

Uppercase initials of a name: the first letter of the first word and of the last word (so `"Maria da Silva"` is `"MS"`). With `max: 3` the first two words and the last are used.

```typescript
getInitials('Maria da Silva');                    // → "MS"
getInitials('madonna');                           // → "M"
getInitials('Ada King Lovelace', { max: 3 });     // → "AKL"
getInitials('', { fallback: '?' });               // → "?"
```

| Option | Default | Description |
|--------|---------|-------------|
| `max` | `2` | Maximum number of letters |
| `fallback` | `""` | Returned when the name has no usable word |

Words are split on whitespace and a word's leading punctuation is skipped, so `'"Ada"'` gives `A`. Emoji and symbols are not letters and are skipped. Only the first 1000 characters are read.

Invalid input returns: `fallback` (`null`, `undefined`, empty text, or `max` below 1).

#### Replacing a local copy

Local versions usually take the first two words (`"Maria da"` gives `MD`) and crash on empty strings; this uses first and last word and returns `fallback`.

### `escapeHtml(text)`

Escapes `& < > " '` so text is safe in HTML content and quoted attributes. It escapes text; it does not sanitize HTML (see `removeHtmlTags`).

```typescript
escapeHtml('<b class="x">Tom & Jerry</b>');
// → "&lt;b class=&quot;x&quot;&gt;Tom &amp; Jerry&lt;/b&gt;"
```

Invalid input returns: `""` for non-string input.

#### Replacing a local copy

Local copies often forget `'` (breaking single-quoted attributes) or escape `&` last (double-escaping); this escapes all five in one pass.

### `escapeRegExp(text)`

Escapes regex metacharacters so user input matches literally inside a `RegExp`.

```typescript
new RegExp(escapeRegExp('1+1=2')).test('1+1=2'); // → true
escapeRegExp('a.b*c');                           // → "a\\.b\\*c"
```

Invalid input returns: `""` for non-string input.

#### Replacing a local copy

Same escaping as the MDN snippet `replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`.

### `pluralize(count, singular, plural?)`

Picks `singular` when `count` is 1 or -1 and `plural` otherwise. `plural` defaults to `singular + "s"`. English-style rules only; for other plural categories use `Intl.PluralRules`.

```typescript
pluralize(1, 'item');            // → "item"
pluralize(0, 'item');            // → "items"
pluralize(2, 'mês', 'meses');    // → "meses"
```

Invalid input returns: the plural form (`NaN` and fractional counts are plural).

#### Replacing a local copy

Replaces `${n} item${n === 1 ? '' : 's'}` ternaries. It returns only the word; build the sentence yourself: `` `${n} ${pluralize(n, 'item')}` ``.

### `truncate(str, length, suffixOrOptions?)`

Truncates a string to at most `length` characters, suffix included, appending `suffix` (default `"..."`). The third argument is the suffix string or `{ suffix?, wordBoundary? }`; `wordBoundary: true` cuts at the last whitespace instead of mid-word (hard cut when there is none). When `length` is shorter than the suffix, the suffix itself is cut to fit (`length` `0` returns `""`). Throws if `length` is negative, `NaN`, or infinite.

```typescript
truncate('Hello world', 5);          // → "He..."
truncate('Hello world', 5, '…');     // → "He…"
truncate('Hi', 10);                  // → "Hi"  (no truncation needed)
truncate('Hello world', 2);          // → ".."  (never exceeds length)
truncate('hello brave world', 14, { wordBoundary: true }); // → "hello brave..."
```

### `removeHtmlTags(input, options?)`

Strips all HTML tags from a string in linear time. Only `<` followed by a letter, `/`, `!`, `?` or `>` starts a tag, so prose like `a < b and c > d` is left alone. Input longer than 100,000 characters is truncated to that length before stripping. A `<` left over from nested input (`<<b>x>`) is dropped so no tag is reassembled. It strips text; it is not an HTML sanitizer.

```typescript
removeHtmlTags('<p>Hello <strong>world</strong></p>'); // → "Hello world"
removeHtmlTags('<img src="x" alt="image">');           // → ""
removeHtmlTags('<p>a &amp; b</p>', { decodeEntities: true }); // → "a & b"
```

| Option | Default | Description |
|--------|---------|-------------|
| `decodeEntities` | `false` | Decodes `&amp; &lt; &gt; &quot; &nbsp;` and numeric entities (once, no double decoding). The result is plain text, so escape it (`escapeHtml`) before inserting it into HTML |
| `collapseWhitespace` | `false` | Collapses whitespace runs, newlines included, into one space and trims |

### `markdownToText(markdown, options?)`

Converts Markdown to plain text, stripping all formatting while preserving content and sensible line breaks.

```typescript
markdownToText('# Hello **World**');           // → "Hello World"
markdownToText('[Click here](https://x.com)'); // → "Click here"
markdownToText('```js\nconsole.log("hi")\n```'); // → 'console.log("hi")'
markdownToText('> A blockquote');              // → "A blockquote"
markdownToText('[docs](https://x.dev)', { keepLinkUrls: true }); // → "docs (https://x.dev)"
```

| Option | Default | Description |
|--------|---------|-------------|
| `keepLinkUrls` | `false` | Keeps link targets as `text (url)`; the optional link title is dropped |
| `singleLine` | `false` | Joins the result into one line with single spaces |

Intraword underscores (`my_variable_name`) are preserved; `_`/`__` only count as emphasis at word boundaries.

Handles: headings, bold/italic, code blocks, inline code, links, images, HTML tags, blockquotes, lists, tables, footnotes, and horizontal rules.

---

## Time formatting

### `formatSecondsToHMS(totalSeconds, options?)`

Formats a number of seconds into `HH:MM:SS` (or `MM:SS` if under an hour). Negative and non-finite input (`NaN`, `±Infinity`) is treated as `0`.

```typescript
formatSecondsToHMS(3661); // → "01:01:01"
formatSecondsToHMS(90);   // → "01:30"
formatSecondsToHMS(5);    // → "00:05"
formatSecondsToHMS(0);    // → "00:00"
formatSecondsToHMS(65, { alwaysShowHours: true }); // → "00:01:05"
formatSecondsToHMS(1.2, { rounding: 'ceil' });     // → "00:02"
```

| Option | Default | Description |
|--------|---------|-------------|
| `alwaysShowHours` | `false` | Keeps the hours part under one hour |
| `rounding` | `"round"` | `"round"`, `"floor"` or `"ceil"` for fractional seconds |

### `formatSecondsToFragment(secs, options?)`

Converts seconds to a YouTube-style timestamp fragment (e.g. `1h2m3s`). Negative and non-finite input (`NaN`, `±Infinity`) is treated as `0`.

```typescript
formatSecondsToFragment(3723); // → "1h2m3s"
formatSecondsToFragment(90);   // → "1m30s"
formatSecondsToFragment(42);   // → "42s"
formatSecondsToFragment(3600); // → "1h"
formatSecondsToFragment(3723, { separator: ' ' }); // → "1h 2m 3s"
```

| Option | Default | Description |
|--------|---------|-------------|
| `separator` | `""` | Placed between the parts |
| `rounding` | `"floor"` | `"round"`, `"floor"` or `"ceil"` for fractional seconds |

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
