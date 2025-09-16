import "dayjs"
import type { IDayjsIntlConfig } from "../date/dayjs"

declare module "dayjs" {
  interface Dayjs {
    formatIntl(config?: IDayjsIntlConfig): string
    toIntlFormatter(config?: IDayjsIntlConfig): Intl.DateTimeFormat
  }
}
