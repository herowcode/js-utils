---
"@herowcode/utils": minor
---

`/api`: add a client-level `redirect` option (`apiClient({ redirect: "error" })`) applied to every request; a per-request `redirect` still wins. The default stays `"follow"`.
