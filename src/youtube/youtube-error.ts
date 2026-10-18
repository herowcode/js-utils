export type TYouTubeErrorSource =
  | "innertube"
  | "watch-page"
  | "oembed"
  | "noembed"
  | "thumbnail"
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

export function reportInvalidUrl(
  options: IYouTubeErrorOptions | undefined,
): void {
  reportYouTubeError(options, {
    source: "validation",
    message: "invalid YouTube URL",
  })
}

export function reportMissingThumbnail(
  options: IYouTubeErrorOptions | undefined,
): void {
  reportYouTubeError(options, {
    source: "thumbnail",
    message: "no thumbnail available",
  })
}

export function reportYouTubeError(
  options: IYouTubeErrorOptions | undefined,
  error: IYouTubeSourceError,
): void {
  try {
    const result: unknown = options?.onError?.(error)
    // An async callback's rejection would otherwise surface as an unhandled rejection
    if (result instanceof Promise) result.catch(() => {})
  } catch {
    // A failing callback must not change the result
  }
}
