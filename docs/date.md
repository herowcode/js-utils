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
| `locale` | `string` | BCP 47 locale tag (e.g. `"en-US"`, `"pt-BR"`) |
| `opts` | `Intl.DateTimeFormatOptions` | Standard Intl formatting options |

---

## `getRelativeTime(date, dateNow?)`

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
