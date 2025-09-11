# @herowcode/utils

A lightweight collection of utility functions for everyday JavaScript/TypeScript development. Built with dayjs for powerful date manipulation and React hooks for YouTube integration.

## Features

- 🚀 **Powered by dayjs** - Robust date manipulation with dayjs integration
- 📦 **TypeScript support** - Full type definitions included  
- 🧪 **Well tested** - Comprehensive test coverage
- 📱 **Universal** - Works in Node.js and browsers
- 🎯 **Tree-shakable** - Only import what you need
- 📂 **Scoped exports** - Import from specific modules
- 🎥 **YouTube utilities** - Extract video IDs, generate URLs, and get video durations

## Installation

```bash
npm install @herowcode/utils
# or
yarn add @herowcode/utils
```

## Usage

### Import everything:
```typescript
import { formatDate, capitalize, debounce, extractYouTubeId } from '@herowcode/utils';
```

### Import by scope:
```typescript
import { formatDate, addDays } from '@herowcode/utils/date';
import { capitalize, camelCase } from '@herowcode/utils/string';
import { randomInt } from '@herowcode/utils/number';
import { debounce, throttle } from '@herowcode/utils/function';
import { extractYouTubeId, generateYoutubeURL } from '@herowcode/utils/youtube';
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

// YouTube utilities
const videoId = extractYouTubeId('https://youtu.be/dQw4w9WgXcQ'); // "dQw4w9WgXcQ"
const embedUrl = generateYoutubeURL({ 
  videoURL: 'https://youtu.be/abc123', 
  embed: true, 
  autoplay: true 
}); // "https://www.youtube.com/embed/abc123?autoplay=1"
```

## API Reference

### Array Utilities

#### `shuffle<T>(array: T[]): T[]`
Returns a new array with the elements shuffled in random order.

```typescript
shuffle([1, 2, 3, 4]); // e.g., [3, 1, 4, 2]
```

#### `unique<T>(array: T[]): T[]`
Removes duplicate values from an array, preserving the first occurrence.

```typescript
unique([1, 2, 2, 3, 1]); // [1, 2, 3]
```

### Date Utilities

#### `formatDate(date: Date | string | number, locale?: string, opts?: Intl.DateTimeFormatOptions): string`
Formats a date using the specified locale and options.

```typescript
formatDate(new Date('2023-12-25'), 'en-US'); // "December 25, 2023"
```

#### `fixTimezoneOffset(utcDate: Date | string): Dayjs`
Adjusts a UTC date string or Date object for the local timezone offset.

```typescript
fixTimezoneOffset('2025-09-08T12:00:00Z');
```

#### `getCurrentDateInUTC(): Dayjs`
Returns the current date/time as a Dayjs object in UTC.

```typescript
getCurrentDateInUTC();
```

#### `getDateInUTC(date: Date): Dayjs`
Converts a Date to a Dayjs object in UTC.

```typescript
getDateInUTC(new Date());
```

#### `parseTimeSpent(initialDate: string | Date, finalDate: string | Date, locale?: string): string`
Returns a human-readable string describing the time difference between two dates, localized.

```typescript
parseTimeSpent('2020-01-01', '2022-04-16', 'en-US'); // "2 years, 3 months, and 15 days"
```

### Files Utilities

#### `compressImage({ file, maxWidth, maxHeight, quality, allowedFileTypes }): Promise<File>`
Compresses an image file to WebP format, optionally resizing and restricting file types.

```typescript
await compressImage({ file, maxWidth: 800, maxHeight: 600, quality: 0.8 });
```

#### `downloadUrl(url: string): Promise<boolean>`
Downloads a file from a URL in the browser, returning true if successful.

```typescript
await downloadUrl('https://example.com/file.pdf');
```

#### `formatBytes(bytes: number): string`
Formats a byte count as a human-readable string (e.g., "1.23 MB").

```typescript
formatBytes(1234567); // "1.18 MB"
```

### Function Utilities

#### `debounce<T>(fn: T, delay: number): (...args: Parameters<T>) => void`
Creates a debounced function that delays invoking `fn` until after `delay` ms have elapsed since the last call.

```typescript
const debounced = debounce(() => { /* ... */ }, 300);
```

#### `throttle<T>(fn: T, delay: number): (...args: Parameters<T>) => void`
Creates a throttled function that only invokes `fn` at most once per `delay` ms.

```typescript
const throttled = throttle(() => { /* ... */ }, 100);
```

#### `tryCatch<T, E = Error, D = null>(fn: Promise<T> | (() => Promise<T> | T), defaultData?: D): Promise<{ data: T | D; error: E | null }>`
Executes a function or promise and returns an object with `data` or `error`.

```typescript
const result = await tryCatch(() => fetchData());
if (result.error) { /* handle error */ }
```

### String Utilities

#### `camelCase(str: string): string`
Converts a string to camelCase.

```typescript
camelCase('hello world'); // "helloWorld"
```

#### `capitalize(str: string): string`
Capitalizes the first letter and lowercases the rest.

```typescript
capitalize('hELLO'); // "Hello"
```

#### `formatHMSToSeconds(val?: number | string): number | null`
Converts HMS time format or numeric strings to seconds. Supports formats like "90", "01:30", "1:02:03".

```typescript
formatHMSToSeconds("1:30"); // 90
formatHMSToSeconds("1:02:03"); // 3723
formatHMSToSeconds(120); // 120
```

#### `formatSecondsToFragment(secs: number): string`
Converts seconds to YouTube-style fragment format (e.g., "1h2m3s").

```typescript
formatSecondsToFragment(3723); // "1h2m3s"
formatSecondsToFragment(90); // "1m30s"
formatSecondsToFragment(42); // "42s"
```

#### `formatSecondsToHMS(totalSeconds: number): string`
Formats a number of seconds into an HH:MM:SS string, rounding and clamping negatives to zero.

```typescript
formatSecondsToHMS(3661); // "01:01:01"
formatSecondsToHMS(5); // "00:05"
```

#### `formatStringToTime(str: string): string`
Parses a numeric time string (or a string containing digits) into MM:SS or HH:MM:SS format. Non-digits are removed before formatting. Short inputs are zero-padded.

```typescript
formatStringToTime('123'); // "01:23"
formatStringToTime('12345'); // "01:23:45"
formatStringToTime(' 12:34 '); // "12:34"
```

#### `kebabCase(str: string): string`
Converts a string to kebab-case.

```typescript
kebabCase('Hello World'); // "hello-world"
```

#### `removeHtmlTags(input: string): string`
Removes all HTML tags from a string.

```typescript
removeHtmlTags('<p>Hello</p>'); // "Hello"
```

#### `slugify(text: string): string`
Converts a string to a URL-friendly slug.

```typescript
slugify('Hello World!'); // "hello-world"
```

#### `snakeCase(str: string): string`
Converts a string to snake_case.

```typescript
snakeCase('Hello World'); // "hello_world"
```

#### `toSentenceCase(str: string): string`
Converts a string to sentence case.

```typescript
toSentenceCase('helloWorld'); // "Hello world"
```

#### `truncate(str: string, length: number, suffix = "..."): string`
Truncates a string to a specified length, appending a suffix if truncated.

```typescript
truncate('Hello world', 5); // "He..."
```

### YouTube Utilities

#### `extractYouTubeId(urlString: string | null): string | null`
Extracts the video ID from various YouTube URL formats.

```typescript
extractYouTubeId('https://youtu.be/dQw4w9WgXcQ'); // "dQw4w9WgXcQ"
extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'); // "dQw4w9WgXcQ"
extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ'); // "dQw4w9WgXcQ"
extractYouTubeId('invalid-url'); // null
```

#### `generateYoutubeURL(options: TCreateYoutubeLinkOptions): string | null`
Generates YouTube URLs with various options for watch, embed, or short formats.

```typescript
// Basic watch URL
generateYoutubeURL({ videoURL: 'https://youtu.be/abc123' });
// "https://www.youtube.com/watch?v=abc123"

// Embed URL with autoplay
generateYoutubeURL({ 
  videoURL: 'https://youtu.be/abc123', 
  embed: true, 
  autoplay: true 
});
// "https://www.youtube.com/embed/abc123?autoplay=1"

// Short URL with timestamp
generateYoutubeURL({ 
  videoURL: 'https://youtu.be/abc123', 
  short: true, 
  start: "1:30" 
});
// "https://youtu.be/abc123?t=90"

// URL with fragment timestamp
generateYoutubeURL({ 
  videoURL: 'https://youtu.be/abc123', 
  start: "1:30", 
  useFragment: true 
});
// "https://www.youtube.com/watch?v=abc123#t=1m30s"
```

**Options:**
- `videoURL` (required): YouTube URL to process
- `start`/`end`: Start/end times as seconds (number) or HMS strings ("90", "01:30", "1:02:03")
- `embed`: Generate embed URL format
- `short`: Generate youtu.be short URL format
- `useFragment`: Use #t=1m2s style fragment for timestamps
- `autoplay`, `controls`, `rel`, `loop`, `mute`, `modestbranding`: Player options
- `origin`, `playlist`: Additional parameters
- `params`: Custom query parameters

#### `useGetYoutubeVideoDuration(): (videoUrl: string) => Promise<string | null>`
React hook that returns a function to get YouTube video duration using the YouTube IFrame API.

```typescript
import { useGetYoutubeVideoDuration } from '@herowcode/utils/youtube';

function VideoComponent() {
  const getVideoDuration = useGetYoutubeVideoDuration();
  
  const handleGetDuration = async () => {
    const duration = await getVideoDuration('https://youtu.be/dQw4w9WgXcQ');
    console.log(duration); // "03:32" or null if failed
  };
  
  return <button onClick={handleGetDuration}>Get Duration</button>;
}
```

**Features:**
- Automatically loads YouTube IFrame API if not present
- Creates offscreen iframe for duration detection
- Handles retry logic for videos that don't immediately report duration
- 10-second timeout with automatic cleanup
- Returns formatted duration string (HH:MM:SS) or null on failure

#### `validateYoutubeLink(videoUrl: string): Promise<boolean>`
Checks whether a YouTube video exists by probing thumbnails and falling back to the oEmbed endpoint. Returns `true` for found/public videos and `false` otherwise.

```typescript
const ok = await validateYoutubeLink('https://youtu.be/dQw4w9WgXcQ');
// true | false
```

## Browser Support

This library supports all modern browsers and Node.js environments. It uses ES2018 features and requires:

- Node.js 10+
- Modern browsers (Chrome 63+, Firefox 58+, Safari 12+, Edge 79+)

The YouTube utilities require a browser environment with DOM support.

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