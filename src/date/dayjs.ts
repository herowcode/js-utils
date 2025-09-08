import dayJs from "dayjs"
import advancedFormat from "dayjs/plugin/advancedFormat.js"
import customParseFormat from "dayjs/plugin/customParseFormat.js"
import localizedFormat from "dayjs/plugin/localizedFormat.js"
import relativeTime from "dayjs/plugin/relativeTime.js"
import timezone from "dayjs/plugin/timezone.js"
import utc from "dayjs/plugin/utc.js"

dayJs.extend(utc)
dayJs.extend(customParseFormat)
dayJs.extend(advancedFormat)
dayJs.extend(timezone)
dayJs.extend(localizedFormat)
dayJs.extend(relativeTime)

export const dayjs = dayJs
