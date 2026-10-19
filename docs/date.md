# `@herowcode/utils/date`

Date formatting, timezone handling, relative time, and time-spent parsing. Powered by [dayjs](https://day.js.org/).

```typescript
import {
  formatDate,
  getRelativeTime,
  parseTimeSpent,
  fixTimezoneOffset,
  getCurrentDateInUTC,
  getDateInUTC,
  toISODate,
  getTodayISODate,
  addDaysISO,
  diffDaysISO,
  parseISODateLocal,
  getZonedHour,
  getDatePartsInTimeZone,
} from '@herowcode/utils/date';
```

---

## `formatDate(date, locale?, opts?)`

Formats a date using the `Intl.DateTimeFormat` API with locale support.

```typescript
formatDate(new Date('2025-12-25'), 'en-US');
// → "December 25, 2025"

formatDate('2025-12-25', 'pt-BR');
// → "25 de dezembro de 2025"

formatDate(new Date(), 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
// → "Mar 27, 2026"
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `date` | `Date \| string \| number` | The date to format |
| `locale` | `string \| Intl.Locale` | BCP 47 locale tag (e.g. `"en-US"`, `"pt-BR"`) or an `Intl.Locale` |
| `opts` | `Intl.DateTimeFormatOptions` | Standard Intl formatting options |

Pass a config object as the second argument to use `fallback`: `formatDate(value, { fallback: '-' })` returns `'-'` for an invalid date instead of throwing. Without `fallback` an invalid date still throws `RangeError("Invalid time value")`. The config object also accepts `locale`, `format` (dayjs tokens), `intl` and `useIntl`.

```typescript
formatDate('not a date', { format: 'DD/MM/YYYY', fallback: '-' }); // → "-"
```

Invalid input returns: `fallback` when set on the config object, otherwise throws `RangeError`.

A string that is a dayjs token (e.g. `"MM"`, `"DD"`, `"YYYY"`) or is not a valid locale tag (e.g. `"DD/MM/YYYY"`) is used as a dayjs format instead of a locale.

---

## Date-only helpers

Values are `YYYY-MM-DD` strings. These helpers use `Intl` only and never load dayjs, so `import { toISODate } from '@herowcode/utils/date'` stays small.

> **Servers: pass `timeZone` explicitly.** `timeZone` defaults to the runtime's zone, and servers and edge runtimes usually run in UTC, so omitting it gives the UTC day (the bug `toISOString().slice(0, 10)` has). It never silently means UTC, but on a UTC server it behaves like it.

### `toISODate(date, options?)`

The calendar day of an instant in `timeZone`. Accepts `Date`, timestamps and date strings; a bare `YYYY-MM-DD` string is returned unchanged.

```typescript
toISODate(new Date('2026-01-02T01:30:00Z'), { timeZone: 'America/Sao_Paulo' }); // → "2026-01-01"
```

Options: `timeZone`, `fallback` (default `""`). Invalid input returns: `fallback`. An unknown `timeZone` throws a `RangeError`.

### `getTodayISODate(options?)`

Today in `timeZone`. Options: `timeZone`, `now` (a `Date` or timestamp, for tests).

```typescript
getTodayISODate({ timeZone: 'America/Sao_Paulo' }); // → "2026-01-01" at 22:30 local
```

Invalid input returns: not applicable; an unknown `timeZone` throws a `RangeError`.

### `addDaysISO(isoDate, days, options?)`

Calendar math on the Y/M/D parts (via `Date.UTC`), so DST cannot shift the result.

```typescript
addDaysISO('2028-02-28', 1); // → "2028-02-29"
addDaysISO('2026-12-31', 1); // → "2027-01-01"
```

Options: `fallback` (default `""`). Invalid input returns: `fallback` (malformed or nonexistent date, non-integer `days`).

### `diffDaysISO(a, b, options?)`

Whole calendar days `a - b`.

```typescript
diffDaysISO('2026-03-10', '2026-03-01'); // → 9
```

Options: `fallback` (default `NaN`). Invalid input returns: `fallback`.

### `parseISODateLocal(isoDate, options?)`

`YYYY-MM-DD` to a `Date` at local midnight. `new Date("2026-01-01")` is UTC midnight, which is the previous day west of UTC.

Options: `fallback` (default `null`). Invalid input returns: `fallback`.

### `getZonedHour(date, options?)`

The hour, 0-23, of an instant in `timeZone` (midnight is `0`, never `24`).

```typescript
getZonedHour(new Date('2026-01-02T01:30:00Z'), { timeZone: 'America/Sao_Paulo' }); // → 22
```

Options: `timeZone`, `fallback` (default `NaN`). Invalid input returns: `fallback`.

### `getDatePartsInTimeZone(date, options?)`

`{ year, month, day, hour, minute, second }` of an instant in `timeZone`.

Options: `timeZone`, `fallback` (default `null`). Invalid input returns: `fallback`.

### Replacing a local copy

| Local pattern | Use |
|---------------|-----|
| `date.toISOString().slice(0, 10)` | `toISODate(date, { timeZone })` (the slice gives the UTC day: tomorrow after 21:00 in Brazil) |
| `new Date("2026-01-01")` for a date-only value | `parseISODateLocal("2026-01-01")` |
| `d.setDate(d.getDate() + n)` on a day string | `addDaysISO(day, n)` |
| `Math.round((a - b) / 86400000)` | `diffDaysISO(a, b)` |

---

## `withDayjsGlobalIntl(config, callback)`

Runs `callback` with a temporary global Intl configuration (also see `setDayjsGlobalIntl`, `getDayjsGlobalIntl`, `resetDayjsGlobalIntl`).

> **Warning:** the previous configuration is restored as soon as `callback` returns. It is not safe for async callbacks (anything after the first `await` runs with the original config) or for concurrent SSR requests, because the configuration is process-wide. Pass the locale and options explicitly to `formatDate` / `formatIntl` in those cases.

---

## `getRelativeTime(date, dateNow?, options?)`

Returns a human-readable relative time string. Accepts any input supported by dayjs.

```typescript
getRelativeTime(new Date());
// → "a few seconds ago"

getRelativeTime('2025-01-01');
// → "15 months ago"  (relative to now)

// With a custom reference point
getRelativeTime('2025-09-15T11:59:00Z', dayjs('2025-09-15T12:00:00Z'));
// → "a minute ago"
```

Without `style` or `calendar` the output is the dayjs string above, unchanged. Setting either switches to `Intl.RelativeTimeFormat` (default locale `pt-BR`) and picks the largest whole unit: seconds under 60, minutes under 60, hours under 24, days under 7, weeks under 5, then months (under 12) and years.

```typescript
const now = dayjs('2025-09-15T12:00:00Z');

getRelativeTime(now.subtract(5, 'minute'), now, { style: 'short' });
// → "há 5 min."
getRelativeTime(now.subtract(1, 'day'), now, { calendar: true });
// → "ontem"
getRelativeTime(now.subtract(1, 'day'), now, { calendar: true, locale: 'en' });
// → "yesterday"
getRelativeTime('garbage', now, { fallback: '-' });
// → "-"
```

| Option | Default | Description |
|--------|---------|-------------|
| `style` | none | `"long"`, `"short"` or `"narrow"`; enables the Intl path (`"long"` when only `calendar` is set) |
| `calendar` | `false` | Words such as "ontem"/"yesterday" instead of "1 dia atrás" (`numeric: "auto"`); enables the Intl path |
| `locale` | `"pt-BR"` | BCP 47 locale for the Intl path |
| `fallback` | none | Returned when `date` or `dateNow` is invalid, on either path |

Invalid input returns: `fallback` when set; otherwise the dayjs result for an invalid date, as before.

---

## `parseTimeSpent(initialDate, finalDate, locale?, options?)`

Decomposes the time between two dates into years, months, days, hours, minutes, and seconds — plus a formatted string.

```typescript
const result = parseTimeSpent('2020-01-01', '2022-04-16', 'en-US');
// result.years     → 2
// result.months    → 3
// result.days      → 15
// result.formatted → "2 years, 3 months, and 15 days"
```

`locale` is matched exactly first, then by language (`"en"`, `"en-GB"` and `"en_GB"` use `en-US`). Unsupported locales fall back to `pt-BR`. Throws a `RangeError` when either date is invalid.

### Options

| Option | Values | Default | Description |
|--------|--------|---------|-------------|
| `format` | `'verbose' \| 'compact'` | `'verbose'` | `verbose`: "1 day, 3 hours" / `compact`: "1d3h" |
| `minimal` | `boolean` | `false` | Keep only the largest non-zero unit |

```typescript
// Compact format
parseTimeSpent('2022-04-01T00:00:00', '2022-04-02T03:04:05', 'en-US', { format: 'compact' });
// .formatted → "1d3h4min5s"

// Minimal — largest unit only
parseTimeSpent('2022-04-01T00:00:00', '2022-04-02T03:04:05', 'en-US', { minimal: true });
// .formatted → "1 day"
```

### Return type

```typescript
interface ITimeSpent {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
}
```

---

## `fixTimezoneOffset(utcDate)`

Adjusts a UTC date for the local timezone offset. Useful when a server returns dates without timezone info.

```typescript
fixTimezoneOffset('2025-09-08T12:00:00Z');
// → Dayjs object adjusted for local timezone
```

---

## `getCurrentDateInUTC()`

Returns the current date/time as a Dayjs object in UTC.

```typescript
const now = getCurrentDateInUTC();
now.format('YYYY-MM-DD HH:mm:ss'); // "2026-03-27 15:00:00"
```

---

## `getDateInUTC(date)`

Converts a `Date` to a Dayjs object in UTC.

```typescript
const utc = getDateInUTC(new Date('2025-12-25T10:00:00'));
utc.format('HH:mm'); // "13:00" (UTC, offset applied)
```

---

[← Back to README](../README.md)
