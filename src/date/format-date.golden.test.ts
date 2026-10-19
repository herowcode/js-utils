import { describe, expect, it } from "vitest"
import { formatDate } from "./format-date"

const DATE = new Date("2026-03-05T14:07:09.045Z")

// [format, bare string arg, { format } config, { format, locale: "pt-br" } config on epoch ms]
const CASES: [string, string, string, string][] = [
  ["DD/MM/YYYY", "05/03/2026", "05/03/2026", "05/03/2026"],
  ["YYYY-MM-DD", "2026-03-05", "2026-03-05", "2026-03-05"],
  ["HH:mm:ss", "14:07:09", "14:07:09", "14:07:09"],
  [
    "DD/MM/YYYY HH:mm",
    "05/03/2026 14:07",
    "05/03/2026 14:07",
    "05/03/2026 14:07",
  ],
  [
    "dddd, MMMM D, YYYY",
    "Thursday, March 5, 2026",
    "Thursday, March 5, 2026",
    "quinta-feira, março 5, 2026",
  ],
  ["h:mm A", "2:07 PM", "2:07 PM", "2:07 PM"],
  [
    "YYYY-MM-DDTHH:mm:ss.SSS[Z]",
    "2026-03-05T14:07:09.045Z",
    "2026-03-05T14:07:09.045Z",
    "2026-03-05T14:07:09.045Z",
  ],
  ["[Day] D", "Day 5", "Day 5", "Day 5"],
  ["x", "1772719629045", "1772719629045", "1772719629045"],
  ["X", "1772719629", "1772719629", "1772719629"],
  ["Q", "1", "1", "1"],
  ["DD-MM", "05-03", "05-03", "05-03"],
]

describe("formatDate non-Intl golden", () => {
  it.each(CASES)("%s", (format, bare, config, ptBr) => {
    expect(formatDate(DATE, format)).toBe(bare)
    expect(formatDate(DATE, { format })).toBe(config)
    expect(formatDate(DATE.getTime(), { format, locale: "pt-br" })).toBe(ptBr)
  })
})
