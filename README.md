# @herowcode/utils

A lightweight collection of utility functions for everyday JavaScript/TypeScript development. Built with dayjs for powerful date manipulation.

## Features

- 🚀 **Powered by dayjs** - Robust date manipulation with dayjs integration
- 📦 **TypeScript support** - Full type definitions included  
- 🧪 **Well tested** - Comprehensive test coverage
- 📱 **Universal** - Works in Node.js and browsers
- 🎯 **Tree-shakable** - Only import what you need
- 📂 **Scoped exports** - Import from specific modules

## Installation

```bash
npm install @herowcode/utils
# or
yarn add @herowcode/utils
```

## Usage

### Import everything:
```typescript
import { formatDate, capitalize, debounce } from '@herowcode/utils';
```

### Import by scope:
```typescript
import { formatDate, addDays } from '@herowcode/utils/date';
import { capitalize, camelCase } from '@herowcode/utils/string';
import { randomInt } from '@herowcode/utils/number';
import { debounce, throttle } from '@herowcode/utils/function';
```

### Examples:
```typescript
// Date formatting with dayjs power
console.log(formatDate(new Date(), 'DD/MM/YYYY')); // "08/09/2025"
console.log(formatDate('2023-12-25', 'MMMM Do, YYYY')); // "December 25th, 2023"

// String utilities
console.log(capitalize('hello world')); // "Hello world"
console.log(camelCase('hello-world')); // "helloWorld"
console.log(kebabCase('helloWorld')); // "hello-world"

// Function utilities
const debouncedFn = debounce(() => console.log('Called!'), 300);
```

## API Reference

### Date Utilities

#### `formatDate(date: Date, format: string): string`

Formats a date according to the specified format.

**Supported format tokens:**
- `YYYY` - 4-digit year
- `YY` - 2-digit year
- `MM` - 2-digit month (01-12)
- `DD` - 2-digit day (01-31)
- `HH` - 2-digit hours (00-23)
- `mm` - 2-digit minutes (00-59)
- `ss` - 2-digit seconds (00-59)

```typescript
formatDate(new Date('2023-12-25'), 'YYYY-MM-DD'); // "2023-12-25"
formatDate(new Date('2023-12-25'), 'DD/MM/YYYY'); // "25/12/2023"
formatDate(new Date('2023-12-25T10:30:45'), 'DD/MM/YYYY HH:mm:ss'); // "25/12/2023 10:30:45"
```

#### `addDays(date: Date, amount: number): Date`

Adds a specified number of days to a date. Returns a new Date object.

```typescript
const date = new Date('2023-12-25');
addDays(date, 5); // 2023-12-30
addDays(date, -5); // 2023-12-20
```

#### `diffInDays(date1: Date, date2: Date): number`

Calculates the difference in days between two dates.

```typescript
const date1 = new Date('2023-12-30');
const date2 = new Date('2023-12-25');
diffInDays(date1, date2); // 5
diffInDays(date2, date1); // -5
```

#### `isBefore(date1: Date, date2: Date): boolean`

Checks if the first date is before the second date.

```typescript
const date1 = new Date('2023-12-20');
const date2 = new Date('2023-12-25');
isBefore(date1, date2); // true
isBefore(date2, date1); // false
```

#### `isAfter(date1: Date, date2: Date): boolean`

Checks if the first date is after the second date.

```typescript
const date1 = new Date('2023-12-30');
const date2 = new Date('2023-12-25');
isAfter(date1, date2); // true
isAfter(date2, date1); // false
```

### String Utilities

#### `capitalize(str: string): string`

Capitalizes the first letter of a string and converts the rest to lowercase.

```typescript
capitalize('hello world'); // "Hello world"
capitalize('HELLO WORLD'); // "Hello world"
capitalize('hELLo WoRLd'); // "Hello world"
```

#### `camelCase(str: string): string`

Converts a string to camelCase by removing special characters and capitalizing words.

```typescript
camelCase('hello world'); // "helloWorld"
camelCase('hello-world'); // "helloWorld"
camelCase('hello_world_test'); // "helloWorldTest"
camelCase('The Quick Brown Fox'); // "theQuickBrownFox"
```

### Number Utilities

#### `randomInt(min: number, max: number): number`

Generates a random integer between min and max (inclusive).

```typescript
randomInt(1, 10); // Random integer between 1 and 10
randomInt(0, 100); // Random integer between 0 and 100
randomInt(-5, 5); // Random integer between -5 and 5
```

### Function Utilities

#### `debounce<T>(fn: T, delay: number): T`

Creates a debounced function that delays invoking `fn` until after `delay` milliseconds have elapsed since the last time it was invoked.

```typescript
const debouncedSearch = debounce((query: string) => {
  console.log('Searching for:', query);
}, 300);

// Will only execute once after 300ms of no new calls
debouncedSearch('a');
debouncedSearch('ab');
debouncedSearch('abc'); // Only this will execute
```

#### `throttle<T>(fn: T, delay: number): T`

Creates a throttled function that only invokes `fn` at most once per every `delay` milliseconds.

```typescript
const throttledScroll = throttle(() => {
  console.log('Scroll event handled');
}, 100);

// Will execute immediately, then at most once every 100ms
window.addEventListener('scroll', throttledScroll);
```

## Browser Support

This library supports all modern browsers and Node.js environments. It uses ES2018 features and requires:

- Node.js 10+
- Modern browsers (Chrome 63+, Firefox 58+, Safari 12+, Edge 79+)

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build the library
npm run build

# Run tests with coverage
npm run test:coverage
```

## License

MIT © [HerowCode](https://github.com/herowcode)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog

### 1.0.0
- Initial release
- Date utilities: `formatDate`, `addDays`, `diffInDays`, `isBefore`, `isAfter`
- String utilities: `capitalize`, `camelCase`
- Number utilities: `randomInt`
- Function utilities: `debounce`, `throttle`
