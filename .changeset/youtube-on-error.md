---
"@herowcode/utils": minor
---

`/youtube`: `getYoutubeVideoInfo` and `getYoutubeVideoDuration` accept an opt-in `{ onError }` that receives each failure reason (`{ source, message, status?, cause? }`) instead of only returning `null`. The `IYouTubeErrorOptions`, `IYouTubeSourceError` and `TYouTubeErrorSource` types are exported.
