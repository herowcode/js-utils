export type TYouTubeErrorSource =
  | "innertube"
  | "watch-page"
  | "oembed"
  | "noembed"
  | "validation"
  | "iframe-api"
  | "player"

export interface IYouTubeSourceError {
  source: TYouTubeErrorSource
  message: string
  /** HTTP status, or the IFrame player error code. */
  status?: number
  cause?: unknown
}

export interface IYouTubeErrorOptions {
  /** Called once per failed source; errors thrown by it are ignored. */
  onError?: (error: IYouTubeSourceError) => void
}

export function reportYouTubeError(
  options: IYouTubeErrorOptions | undefined,
  error: IYouTubeSourceError,
): void {
  try {
    options?.onError?.(error)
  } catch {
    // A failing callback must not change the result
  }
}
