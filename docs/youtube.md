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

Extracts the video ID from any YouTube URL format. Returns `null` for invalid or non-YouTube URLs.

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

Generates a YouTube URL in watch, embed, or short format with player parameters.

```typescript
// Standard watch URL
generateYoutubeURL({ videoURL: 'https://youtu.be/abc123' });
// → "https://www.youtube.com/watch?v=abc123"

// Embed with autoplay and no related videos
generateYoutubeURL({ videoURL: 'https://youtu.be/abc123', embed: true, autoplay: true, rel: false });
// → "https://www.youtube.com/embed/abc123?autoplay=1&rel=0"

// Short URL starting at a timestamp
generateYoutubeURL({ videoURL: 'https://youtu.be/abc123', short: true, start: '1:30' });
// → "https://youtu.be/abc123?t=90"

// Fragment-style timestamp
generateYoutubeURL({ videoURL: 'https://youtu.be/abc123', start: '1:30', useFragment: true });
// → "https://www.youtube.com/watch?v=abc123#t=1m30s"

// Custom start/end times (in seconds)
generateYoutubeURL({ videoURL: 'https://youtu.be/abc123', start: 90, end: 180 });
// → "https://www.youtube.com/watch?v=abc123&start=90&end=180"
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

Concurrent calls for the same video ID share a single in-flight request. Failed requests are evicted from cache so the next call retries. Returns `null` only if **all** sources fail.

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
//   (or hqdefault / mqdefault / default as fallback)
//   or null if none load
```

Priority order: `maxresdefault` → `hqdefault` → `mqdefault` → `default`

> Browser only — uses `Image` load/error events to probe availability without CORS issues.

---

## `validateYoutubeLink(videoUrl)`

Checks whether a YouTube video is publicly available by probing thumbnails and falling back to oEmbed.

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

Automatically loads the YouTube IFrame API if not already present. Creates an offscreen iframe, waits for the player to report its duration, then cleans up. Times out after 10 seconds.

---

[← Back to README](../README.md)
