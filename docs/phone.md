# `@herowcode/utils/phone`

Normalize, format and link Brazilian and US phone numbers. Universal: no Node builtins. Only `BR` (default) and `US` are supported; numbers from other countries are invalid. For CPF, CNPJ and CEP see [`br`](br.md).

```typescript
import {
  buildWhatsAppLink,
  formatPhone,
  getBRMobileVariants,
  normalizePhone,
  onlyDigits,
} from '@herowcode/utils/phone';
```

---

## `onlyDigits(value)`

Keeps only the characters `0-9`.

```typescript
onlyDigits('(11) 99999-9999'); // → "11999999999"
onlyDigits(null);               // → ""
```

Invalid input returns: `""` for anything that is not a string or a finite number.

---

## `normalizePhone(input, options?)`

Converts a number to E.164. Accepts punctuation, the country code (`+55`, `55`, `0055`) and the Brazilian trunk zero (`011`).

```typescript
normalizePhone('(11) 99999-9999');                 // → "+5511999999999"
normalizePhone('0055 11 3333-4444');               // → "+551133334444"
normalizePhone('(415) 555-2671', { country: 'US' }); // → "+14155552671"
normalizePhone('123');                             // → null
normalizePhone('123', { fallback: '' });           // → ""
```

| Option | Default | Description |
|--------|---------|-------------|
| `country` | `"BR"` | `"BR"` or `"US"` |
| `fallback` | `null` | Returned for invalid numbers |

BR numbers need a two-digit area code (no zeros) followed by 8 digits, or 9 digits starting with 9 for mobiles. US numbers follow NANP: area code and exchange start with 2-9.

Invalid input returns: `fallback` (`null` by default).

### Replacing a local copy

Local `normalizePhone` copies usually strip non-digits and prepend `55`, which turns `55 11 99999-9999` into `5555...` and accepts any length. This checks the shape and handles the country code and trunk zero.

---

## `formatPhone(input, options?)`

Formats a number for display.

```typescript
formatPhone('+5511999999999');                          // → "(11) 99999-9999"
formatPhone('1133334444');                              // → "(11) 3333-4444"
formatPhone('11999999999', { international: true });    // → "+55 (11) 99999-9999"
formatPhone('4155552671', { country: 'US' });           // → "(415) 555-2671"
```

| Option | Default | Description |
|--------|---------|-------------|
| `country` | `"BR"` | `"BR"` or `"US"` |
| `international` | `false` | Prefix with the country code |
| `fallback` | `""` | Returned for invalid numbers |

Invalid input returns: `fallback` (`""` by default).

---

## `getBRMobileVariants(input)`

Brazilian mobiles gained a 9th digit in 2012, and some systems still store the old 8-digit form. Returns both spellings in E.164, with the 9 first, so you can look a contact up under either.

```typescript
getBRMobileVariants('(11) 99999-9999'); // → ["+5511999999999", "+551199999999"]
getBRMobileVariants('1199999999');      // → ["+5511999999999", "+551199999999"]
getBRMobileVariants('1133334444');      // → ["+551133334444"] (landline, one entry)
```

Invalid input returns: `[]`.

---

## `buildWhatsAppLink(phone, options?)`

Builds a `https://wa.me/<number>` click-to-chat link; the message is URL-encoded.

```typescript
buildWhatsAppLink('(11) 99999-9999', { message: 'Olá, tudo bem?' });
// → "https://wa.me/5511999999999?text=Ol%C3%A1%2C%20tudo%20bem%3F"
```

| Option | Default | Description |
|--------|---------|-------------|
| `message` | none | Prefilled text |
| `country` | `"BR"` | `"BR"` or `"US"` |
| `fallback` | `""` | Returned for invalid numbers |

Invalid input returns: `fallback` (`""` by default).

### Replacing a local copy

Local `whatsappLink` helpers often forget to encode the message or keep the `+`, which `wa.me` rejects. This normalizes first and sends digits only.

[← Back to README](../README.md)
