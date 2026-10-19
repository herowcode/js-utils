# `@herowcode/utils/array`

Small, dependency-free array helpers.

```typescript
import { chunk, groupBy, keyBy, shuffle, sumBy, unique } from '@herowcode/utils/array';
```

---

## `shuffle<T>(array)`

Returns a new array with elements in random order. Does not mutate the original.

```typescript
shuffle([1, 2, 3, 4, 5]);
// → [3, 1, 5, 2, 4]  (random)

shuffle(['a', 'b', 'c']);
// → ['c', 'a', 'b']  (random)
```

---

## `unique<T>(array)`

Removes duplicate values. Preserves the first occurrence and original order.

```typescript
unique([1, 2, 2, 3, 1, 4]);
// → [1, 2, 3, 4]

unique(['apple', 'banana', 'apple', 'cherry']);
// → ['apple', 'banana', 'cherry']
```

---

## `chunk(array, size)`

Splits an array into consecutive chunks of `size`; the last one may be shorter. Does not mutate the input.

```typescript
chunk([1, 2, 3, 4, 5], 2); // → [[1, 2], [3, 4], [5]]
```

Invalid input returns: `[]` (empty array, or `size` below 1 or not a number). Fractional sizes are floored.

### Replacing a local copy

A local `chunk` built on `splice` mutates its input; this one copies. Pair it with `mapInChunks` from `/async` to process batches.

---

## `sumBy(array, fn)`

Sums `fn(item, index)` over the array.

```typescript
sumBy([{ price: 10 }, { price: 5.5 }], (item) => item.price); // → 15.5
```

Invalid input returns: `0` for an empty array; results that are not finite numbers (`NaN`, `Infinity`) are skipped.

### Replacing a local copy

`reduce((acc, x) => acc + x.n, 0)` propagates `NaN`; `sumBy` skips non-finite values instead.

---

## `groupBy(array, fn)`

Groups items by the key `fn(item, index)` returns, preserving order inside each group. Returns a plain object; a `"__proto__"` key becomes an ordinary own key. Targets ES2022, so it does not rely on `Object.groupBy`.

```typescript
groupBy([1, 2, 3, 4], (n) => (n % 2 ? 'odd' : 'even'));
// → { odd: [1, 3], even: [2, 4] }
```

Invalid input returns: `{}` for an empty array.

### Replacing a local copy

Same result as `Object.groupBy` or a `reduce` that pushes into `acc[key]`, without the prototype-key pitfall.

---

## `keyBy(array, fn)`

Indexes items by the key `fn(item, index)` returns. On duplicate keys the last item wins.

```typescript
keyBy([{ id: 'a', n: 1 }, { id: 'b', n: 2 }], (u) => u.id);
// → { a: { id: 'a', n: 1 }, b: { id: 'b', n: 2 } }
```

Invalid input returns: `{}` for an empty array.

### Replacing a local copy

Replaces `Object.fromEntries(list.map((x) => [x.id, x]))` and `reduce`-based lookup tables.

---

[← Back to README](../README.md)
