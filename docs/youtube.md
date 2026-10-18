# `@herowcode/utils/youtube`

YouTube utilities for extracting IDs, generating URLs, fetching video metadata, and validating links. Works in browser and Node.js environments.

```typescript
import {
  extractYouTubeId,
  generateYoutubeURL,
  getYoutubeVideoInfo,
  getYoutubeThumbnail,
  validateYoutubeLink,
  getYoutubeVideoDuration,
} from '@herowcode/utils/youtube';
```

---

## `extractYouTubeId(urlString)`

Extracts the video ID from any YouTube URL format. Only `youtube.com`, `youtube-nocookie.com`, `youtu.be` and their subdomains are accepted (`evilyoutube.com` and `youtube.com.evil.com` return `null`), and the ID must be 11 characters of `A-Z a-z 0-9 _ -`. Scheme-less input such as `youtu.be/dQw4w9WgXcQ` works.

```typescript
extractYouTubeId('https://youtu.be/dQw4w9WgXcQ');                   // → "dQw4w9WgXcQ"
extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ');    // → "dQw4w9WgXcQ"
extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ');      // → "dQw4w9WgXcQ"
extractYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ');     // → "dQw4w9WgXcQ"
extractYouTubeId('https://www.youtube.com/v/dQw4w9WgXcQ');          // → "dQw4w9WgXcQ"
extractYouTubeId('not-a-youtube-url');                               // → null
extractYouTubeId(null);                                              // → null
```

---

## `generateYoutubeURL(options)`

Generates a YouTube URL in watch, embed, or short format with player parameters. Returns `null` when no valid video ID can be extracted. The `TCreateYoutubeLinkOptions` type is exported.

```typescript
// Standard watch URL
generateYoutubeURL({ videoURL: 'https://youtu.be/dQw4w9WgXcQ' });
// → "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

// Embed with autoplay and no related videos
generateYoutubeURL({ videoURL: 'https://youtu.be/dQw4w9WgXcQ', embed: true, autoplay: true, rel: false });
// → "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"

// Short URL starting at a timestamp
generateYoutubeURL({ videoURL: 'https://youtu.be/dQw4w9WgXcQ', short: true, start: '1:30' });
// → "https://youtu.be/dQw4w9WgXcQ?t=90"

// Fragment-style timestamp
generateYoutubeURL({ videoURL: 'https://youtu.be/dQw4w9WgXcQ', start: '1:30', useFragment: true });
// → "https://www.youtube.com/watch?v=dQw4w9WgXcQ#t=1m30s"

// Custom start/end times (in seconds)
generateYoutubeURL({ videoURL: 'https://youtu.be/dQw4w9WgXcQ', start: 90, end: 180 });
// → "https://www.youtube.com/watch?v=dQw4w9WgXcQ&start=90&end=180"
```

### All options

| Option | Type | Description |
|--------|------|-------------|
| `videoURL` | `string` | **(required)** YouTube URL to process |
| `start` | `number \| string` | Start time in seconds or HMS string (`"1:30"`, `"01:02:03"`) |
| `end` | `number \| string` | End time in seconds or HMS string |
| `embed` | `boolean` | Generate `/embed/` URL format |
| `short` | `boolean` | Generate `youtu.be` short URL |
| `useFragment` | `boolean` | Use `#t=1m30s` fragment for timestamps |
| `autoplay` | `boolean` | Auto-play the video |
| `controls` | `boolean` | Show/hide player controls |
| `rel` | `boolean` | Show related videos at end |
| `loop` | `boolean` | Loop the video |
| `mute` | `boolean` | Start muted |
| `modestbranding` | `boolean` | Hide YouTube logo |
| `origin` | `string` | `origin` parameter for embed security |
| `playlist` | `string` | Playlist ID |
| `params` | `Record<string, string>` | Additional custom query parameters |

---

## `getYoutubeVideoInfo(videoUrl)`

Fetches comprehensive metadata about a YouTube video. Queries **four sources in parallel** and merges their results — no API key required.

```typescript
const info = await getYoutubeVideoInfo('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

if (info) {
  console.log(info.title);         // "Rick Astley - Never Gonna Give You Up"
  console.log(info.channelTitle);  // "Rick Astley"
  console.log(info.viewCount);     // 1500000000
  console.log(info.lengthSeconds); // 213
  console.log(info.thumbnail);     // best quality thumbnail URL
  console.log(info.isLive);        // false
}
```

### Source strategy

All sources run in parallel via `Promise.allSettled`. Each field uses the first non-empty value in the priority order below; thumbnails are merged (deduped by URL):

```
1. InnerTube player endpoint (ANDROID → WEB client)  →  full metadata (primary)
2. Watch page HTML (ytInitialPlayerResponse)         →  full metadata
3. YouTube oEmbed API                                →  title + thumbnail
4. NoEmbed public API                                →  title + description + upload date
```

The InnerTube endpoint is used first because it works reliably from datacenter/containerized environments where YouTube serves a consent page to the regular watch URL. If one source returns partial data, another may fill the gaps (e.g. InnerTube provides `description`/`lengthSeconds` while oEmbed contributes an additional thumbnail size).

Concurrent calls for the same video ID share a single in-flight request. Failed requests are evicted from cache so the next call retries. Each request aborts after 8 seconds. Every call returns its own copy of the result, so mutating it does not affect the cache. Returns `null` only if **all** sources fail.

### Return type

```typescript
type TYouTubeVideoInfo = {
  id: string;
  url: string;
  title: string;
  channelTitle: string;
  channelId?: string;
  channelUrl?: string;
  description?: string;
  shortDescription?: string;
  thumbnails: Array<{ url: string; width?: number; height?: number }>;
  thumbnail?: string;         // best quality thumbnail URL
  publishedAt?: string;       // ISO 8601
  uploadedAt?: string;        // ISO 8601
  keywords?: string[];
  viewCount?: number;
  lengthSeconds?: number;
  isLive?: boolean;
};
```

Returns `null` for invalid URLs, unavailable/deleted videos, or when all sources fail.

---

## `getYoutubeThumbnail(videoUrl)`

Attempts to load thumbnail images in quality order and returns the first URL that resolves successfully.

```typescript
const thumb = await getYoutubeThumbnail('https://youtu.be/dQw4w9WgXcQ');
// → "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
//   (or hqdefault / mqdefault as fallback)
//   or null if none load
```

Priority order: `maxresdefault` → `hqdefault` → `mqdefault`. YouTube answers a missing thumbnail with a 120x90 placeholder image, so images 120px wide or less count as missing (this is also why `default.jpg`, which is 120px, is not probed). Each probe times out after 5 seconds.

> Browser only — uses `Image` load/error events to probe availability without CORS issues. In Node.js the `/youtube` entry's `getYoutubeThumbnail` throws (rejects) because there is no `Image`.

---

## `validateYoutubeLink(videoUrl)`

Checks whether a YouTube video is publicly available by probing thumbnails and falling back to oEmbed. The oEmbed fallback treats `401` (embedding disabled) as valid and `404` as invalid.

```typescript
const isValid = await validateYoutubeLink('https://youtu.be/dQw4w9WgXcQ');
// → true (video exists)

const isInvalid = await validateYoutubeLink('https://youtu.be/INVALID_ID');
// → false (video doesn't exist or is private)
```

---

## `getYoutubeVideoDuration(videoUrl)` _(browser)_

Gets the duration of a YouTube video using the IFrame API. Returns a formatted string or `null`.

```typescript
import { getYoutubeVideoDuration } from '@herowcode/utils/youtube';

const duration = await getYoutubeVideoDuration('https://youtu.be/dQw4w9WgXcQ');
// → "03:32"  or  null on failure
```

Automatically loads the YouTube IFrame API if not already present. Creates an offscreen iframe, waits for the player to report its duration, then cleans up. Resolves `null` if the IFrame API fails to load (script error or 10 second timeout) or the player does not report a duration within 10 seconds. In Node.js this function throws (rejects).

---

[← Back to README](../README.md)
