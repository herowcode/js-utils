const DOCS_URL =
  "https://github.com/herowcode/js-utils/blob/main/docs/errors.md"

export type THerowErrorCode = `HEROW_${string}`

export type THerowError<T extends Error = Error> = T & {
  code: THerowErrorCode
}

/** Internal: builds an error whose message is what + fix + docs link; never pass secret values. */
export function herowError<T extends Error>(
  ErrorClass: new (message: string) => T,
  code: THerowErrorCode,
  what: string,
  fix: string,
): THerowError<T> {
  const url = `${DOCS_URL}#${code.toLowerCase()}`
  return Object.assign(new ErrorClass(`${what} ${fix} See ${url}`), { code })
}
