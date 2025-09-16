import type { ConfigType } from "dayjs"
import { dayjs } from "./dayjs"

export function getRelativeTime(date: ConfigType, dateNow = dayjs()): string {
  return dayjs(date).from(dateNow)
}
