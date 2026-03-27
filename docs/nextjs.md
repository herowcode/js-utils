# `@herowcode/utils/nextjs`

Next.js-specific components. Requires `next` and `react` as peer dependencies.

```typescript
import { OptimizedImage } from '@herowcode/utils/nextjs';
```

---

## `OptimizedImage`

A wrapper around Next.js `<Image>` with sensible defaults for optimized rendering. Handles common patterns like fixed-size images, responsive images, and fill containers without boilerplate.

```tsx
import { OptimizedImage } from '@herowcode/utils/nextjs';

// Basic usage
<OptimizedImage
  src="https://example.com/photo.jpg"
  alt="A photo"
  width={800}
  height={600}
/>

// Fill container (responsive)
<div style={{ position: 'relative', width: '100%', height: 400 }}>
  <OptimizedImage
    src="/hero.jpg"
    alt="Hero image"
    fill
    style={{ objectFit: 'cover' }}
  />
</div>
```

Accepts all props from Next.js `<Image>` — this component adds defaults on top, not restrictions.

---

[← Back to README](../README.md)
