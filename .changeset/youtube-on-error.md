---
"@herowcode/utils": minor
---

`/youtube`: `getYoutubeVideoInfo`, `getYoutubeVideoDuration`, `getYoutubeThumbnail` and `validateYoutubeLink` accept an opt-in `{ onError }` that receives each failure reason (`{ source, message, status?, cause? }`) instead of only returning `null`/`false`. Invalid URLs are reported with source `"validation"`, and every caller sharing an in-flight `getYoutubeVideoInfo` request gets its failures. The `IYouTubeErrorOptions`, `IYouTubeSourceError` and `TYouTubeErrorSource` types are exported.
