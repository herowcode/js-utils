# `@herowcode/utils/number`

Locale-aware number, currency and percent formatting and parsing (pt-BR by default). Universal: no Node builtins, works in browsers, Node and edge runtimes. Output comes from `Intl.NumberFormat`, so exact strings can differ slightly across ICU versions.

```typescript
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  parseLocaleNumber,
  percentOf,
  toNumber,
} from '@herowcode/utils/number';
```

---

## `formatCurrency(value, options?)`

Formats money with `Intl.NumberFormat`. Defaults to BRL in pt-BR.

```typescript
formatCurrency(1234.5);                          // → "R$ 1.234,50"
formatCurrency(123450, { fromCents: true });     // → "R$ 1.234,50"
formatCurrency(1500, { stripZeroCents: true });  // → "R$ 1.500"
formatCurrency(1500000, { compact: true });      // → "R$ 1,5 mi"
formatCurrency(9.9, { currency: 'USD', locale: 'en-US' }); // → "$9.90"
formatCurrency(null, { fallback: '-' });         // → "-"
```

| Option | Default | Description |
|--------|---------|-------------|
| `currency` | `"BRL"` | ISO 4217 code |
| `locale` | `"pt-BR"` | BCP 47 locale |
| `fromCents` | `false` | Treat `value` as minor units (divides by 100) |
| `decimals` | locale default | Fixed number of fraction digits |
| `compact` | `false` | Compact notation (`mil`, `mi`) |
| `stripZeroCents` | `false` | Drop the decimal part only when it is all zeros (`R$ 1.500`, but `R$ 1.500,50` stays). Ignored with `compact` |
| `fallback` | `""` | Returned for invalid input |

**The space after `R$` is U+00A0 (non-breaking), not a regular space.** That is what `Intl` produces for pt-BR, so snapshot tests written against a hand-typed `"R$ 10,00"` fail; compare against `new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(10)` or normalize with `.replace(/ /g, ' ')`.

Invalid input returns: `fallback` for `NaN`, `±Infinity`, `null`, `undefined` and non-number values (strings are not parsed; use `parseLocaleNumber` first). An invalid `currency` code throws a `RangeError` from `Intl`. Negative zero prints as zero.

### Replacing a local copy

A local `formatBRL` built on `toLocaleString` or string concatenation maps to `formatCurrency(value)`. Differences: the NBSP above, `fromCents` replaces `value / 100`, and invalid input yields `fallback` instead of `R$ NaN`.

---

## `formatNumber(value, options?)`

Formats a number with locale separators.

```typescript
formatNumber(1234567.891);                    // → "1.234.567,891"
formatNumber(1234.5, { decimals: 2 });        // → "1.234,50"
formatNumber(1500, { compact: true });        // → "1,5 mil"
formatNumber(1234.5, { locale: 'en-US' });    // → "1,234.5"
```

| Option | Default | Description |
|--------|---------|-------------|
| `locale` | `"pt-BR"` | BCP 47 locale |
| `decimals` | locale default (up to 3) | Fixed number of fraction digits |
| `compact` | `false` | Compact notation |
| `fallback` | `""` | Returned for invalid input |

Invalid input returns: `fallback` (`NaN`, `±Infinity`, `null`, `undefined`, non-numbers).

### Replacing a local copy

Replaces `n.toLocaleString('pt-BR', ...)` wrappers; adds the shared `fallback` convention.

---

## `formatPercent(value, options?)`

Formats a percentage where `25` means 25%.

```typescript
formatPercent(25);                    // → "25%"
formatPercent(12.5);                  // → "12,5%"
formatPercent(50, { decimals: 1 });   // → "50,0%"
formatPercent(percentOf(1, 3), { decimals: 1 }); // → "33,3%"
```

| Option | Default | Description |
|--------|---------|-------------|
| `locale` | `"pt-BR"` | BCP 47 locale |
| `decimals` | up to 2 | Fixed number of fraction digits |
| `fallback` | `""` | Returned for invalid input |

Unlike `Intl`'s `style: "percent"` (where `0.25` is 25%), the input is already in percent units, matching what `percentOf` returns.

Invalid input returns: `fallback`.

### Replacing a local copy

Replaces `` `${n.toFixed(1)}%` `` and `Intl.NumberFormat(..., { style: 'percent' })` calls that need `/ 100`.

---

## `percentOf(part, total, options?)`

`part` as a percentage of `total`.

```typescript
percentOf(1, 4);                      // → 25
percentOf(1, 3, { decimals: 1 });     // → 33.3
percentOf(5, 0);                      // → 0
percentOf(5, 0, { fallback: NaN });   // → NaN
```

| Option | Default | Description |
|--------|---------|-------------|
| `decimals` | none | Round to this many fraction digits |
| `fallback` | `0` | Returned when `total` is `0` or an input is not finite |

Invalid input returns: `fallback`.

### Replacing a local copy

Replaces `(part / total) * 100` that yields `NaN` or `Infinity` on an empty total.

---

## `parseLocaleNumber(text, options?)`

Parses a localized number or money string. Currency symbols and codes, spaces (including U+00A0 and U+202F), group separators and `%` are accepted; negatives may use `-`, `−`, or parentheses.

```typescript
parseLocaleNumber('R$ 1.234,56');                       // → 1234.56
parseLocaleNumber('(R$ 12,50)');                        // → -12.5
parseLocaleNumber('R$ 1,50', { asCents: true });        // → 150
parseLocaleNumber('1,234.56', { locale: 'en-US' });     // → 1234.56
parseLocaleNumber('abc');                               // → NaN
```

| Option | Default | Description |
|--------|---------|-------------|
| `locale` | `"pt-BR"` | Decides the decimal and group separators |
| `decimal` | from `locale` | Overrides the decimal separator (`","` or `"."`) |
| `asCents` | `false` | Return integer minor units instead (`Math.round(value * 100)`) |

The locale resolves ambiguity: in pt-BR, `"1.234"` is `1234` (a group separator) and `"0.5"` is rejected, since a lone `.` that is not followed by exactly three digits is not a valid group. Pass `locale: 'en-US'` for dot decimals. Input longer than 100 characters is rejected.

Invalid input returns: `NaN` (never throws) for empty text, letters, repeated separators, unbalanced parentheses, scientific notation, non-strings.

### Replacing a local copy

Replaces `parseFloat(s.replace('.', '').replace(',', '.'))`, which only removes the first group separator and turns `"abc"` into `NaN` silently or `"12abc"` into `12`. Use `Number.isNaN` to detect failures.

---

## `toNumber(value, options?)`

Coerces a number, bigint or numeric string to a finite number; never returns `NaN`.

```typescript
toNumber('12.5');                          // → 12.5
toNumber('abc');                           // → 0
toNumber(undefined, { fallback: -1 });     // → -1
toNumber('12.9', { integer: true });       // → 12
```

| Option | Default | Description |
|--------|---------|-------------|
| `fallback` | `0` | Returned when the value is not a finite number |
| `integer` | `false` | Truncate toward zero |

It uses `Number()` semantics for strings, so `"1,5"` is not parsed (use `parseLocaleNumber`), and `""` / whitespace use the fallback instead of becoming `0`.

Invalid input returns: `fallback` (`NaN`, `±Infinity`, `null`, `undefined`, booleans, objects, unparseable strings).

### Replacing a local copy

Replaces `Number(x) || 0` and `parseInt(x, 10) || 0` guards; unlike `|| 0` it preserves a legitimate `0` fallback choice and rejects `Infinity`.

---

[← Back to README](../README.md)
