---
"@herowcode/utils": patch
---

`/youtube`: `getYoutubeVideoInfo` caches each result for 1 hour and keeps at most the 100 most recently used videos, instead of holding every video forever.
