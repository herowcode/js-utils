# `@herowcode/utils/br`

Format and validate Brazilian documents: CEP, CPF and CNPJ. Universal: no Node builtins. `format*` functions check only the length and never the check digits; use `isValid*` to validate. For phone numbers see [`phone`](phone.md).

```typescript
import {
  formatCEP,
  formatCNPJ,
  formatCPF,
  isValidCNPJ,
  isValidCPF,
} from '@herowcode/utils/br';
```

---

## `formatCEP(value, options?)`

```typescript
formatCEP('01310100');   // → "01310-100"
formatCEP('1234');       // → ""
formatCEP('1234', { fallback: '-' }); // → "-"
```

Invalid input returns: `fallback` (`""` by default) when the value does not have exactly 8 digits or is not a string.

### Replacing a local copy

Local masks like `value.replace(/(\d{5})(\d{3})/, '$1-$2')` return partial strings for short input. This returns the fallback instead.

---

## `formatCPF(value, options?)`

```typescript
formatCPF('52998224725'); // → "529.982.247-25"
formatCPF('123');         // → ""
```

It does not validate: `formatCPF('11111111111')` returns `"111.111.111-11"`. Combine with `isValidCPF` when validity matters.

Invalid input returns: `fallback` (`""` by default) when the value does not have exactly 11 digits.

### Replacing a local copy

Local masks (`replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, ...)`) return half-formatted strings for short input. This returns `fallback` unless there are exactly 11 digits, and never validates, so pair it with `isValidCPF`.

---

## `isValidCPF(value)`

True for a string with 11 digits (punctuation allowed), correct check digits, and not all the same digit.

```typescript
isValidCPF('529.982.247-25'); // → true
isValidCPF('529.982.247-24'); // → false (check digit)
isValidCPF('111.111.111-11'); // → false (repeated digits)
```

Invalid input returns: `false` for anything that is not a valid CPF, including numbers (they lose leading zeros, so pass a string).

### Replacing a local copy

Local validators often skip the repeated-digits rule, so `000.000.000-00` passes. This rejects it.

---

## `formatCNPJ(value, options?)`

Formats 14 characters. Letters are allowed because CNPJs issued from July 2026 are alphanumeric; they are uppercased.

```typescript
formatCNPJ('11222333000181');  // → "11.222.333/0001-81"
formatCNPJ('12abc34501de35');  // → "12.ABC.345/01DE-35"
```

It does not validate the check digits.

Invalid input returns: `fallback` (`""` by default) when the value does not have exactly 14 letters or digits.

### Replacing a local copy

Local masks only handle 14 digits. This also formats the alphanumeric CNPJ (letters uppercased) and returns `fallback` for any other length.

---

## `isValidCNPJ(value)`

True for a numeric or alphanumeric CNPJ with correct check digits (the last two characters must be digits) and not all the same character.

```typescript
isValidCNPJ('11.222.333/0001-81'); // → true
isValidCNPJ('12.ABC.345/01DE-35'); // → true
isValidCNPJ('00.000.000/0000-00'); // → false
```

Invalid input returns: `false` for anything that is not a valid CNPJ, including non-strings.

### Replacing a local copy

Digit-only validators reject alphanumeric CNPJs issued from July 2026, and often accept `00.000.000/0000-00`. This handles both.

[← Back to README](../README.md)
