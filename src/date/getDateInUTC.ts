import type { Dayjs } from "dayjs"

import { dayjs } from "./dayjs"

export function getDateInUTC(date: Date): Dayjs {
  return dayjs(date).utc()
}
