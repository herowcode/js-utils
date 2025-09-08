import type { Dayjs } from "dayjs"

import { dayjs } from "./dayjs"

export function getCurrentDateInUTC(): Dayjs {
  return dayjs().utc()
}
