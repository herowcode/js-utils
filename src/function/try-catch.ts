type TSuccess<T> = { data: T; error: null }
type TFailure<E, D = null> = { data: D; error: E }

export type TTryCatchResult<T, E = Error, D = null> =
  | TSuccess<T>
  | TFailure<E, D>

/**
 * Enhanced try-catch utility that handles async operations and provides typed results
 *
 * @param fn - The promise or function returning a promise to execute
 * @param defaultData - Optional default value to use for data when an error occurs (instead of null)
 * @returns A consistent result object containing either data or error
 *
 * @example
 * // With a promise
 * const result = await tryCatch(fetchUserData(userId));
 *
 * @example
 * // With a function that returns a promise
 * const result = await tryCatch(() => fetchUserData(userId));
 *
 * @example
 * // With custom default data
 * const result = await tryCatch(fetchItems(), []);
 * // result.data will be an empty array instead of null when error occurs
 */
export async function tryCatch<T, E = Error, D = null>(
  fn: Promise<T> | (() => Promise<T> | T),
  defaultData?: D,
): Promise<TTryCatchResult<T, E, D extends null ? null : D>> {
  try {
    const data = await (typeof fn === "function" ? fn() : fn)
    return {
      data,
      error: null,
    } as TSuccess<T>
  } catch (error) {
    return {
      data: (defaultData ?? null) as D extends null ? null : D,
      error: error as E,
    } as TFailure<E, D extends null ? null : D>
  }
}
