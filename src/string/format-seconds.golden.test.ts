import { describe, expect, it } from "vitest"
import { formatSecondsToFragment } from "./format-seconds-to-fragment"
import { formatSecondsToHMS } from "./format-seconds-to-hms"

const HMS: [string, string][] = [
  ["0", "00:00"],
  ["1", "00:01"],
  ["59", "00:59"],
  ["60", "01:00"],
  ["61", "01:01"],
  ["3599", "59:59"],
  ["3600", "01:00:00"],
  ["3661", "01:01:01"],
  ["86399", "23:59:59"],
  ["86400", "24:00:00"],
  ["90061", "25:01:01"],
  ["1.4", "00:01"],
  ["1.5", "00:02"],
  ["59.5", "01:00"],
  ["3599.5", "01:00:00"],
  ["-5", "00:00"],
  ["NaN", "00:00"],
  ["Infinity", "00:00"],
  ["-Infinity", "00:00"],
  ["36000", "10:00:00"],
  ["359999", "99:59:59"],
]
const FRAGMENT: [string, string][] = [
  ["0", "0s"],
  ["1", "1s"],
  ["59", "59s"],
  ["60", "1m"],
  ["61", "1m1s"],
  ["3599", "59m59s"],
  ["3600", "1h"],
  ["3661", "1h1m1s"],
  ["86399", "23h59m59s"],
  ["86400", "24h"],
  ["90061", "25h1m1s"],
  ["1.4", "1s"],
  ["1.5", "1s"],
  ["59.5", "59s"],
  ["3599.5", "59m59s"],
  ["-5", "0s"],
  ["NaN", "0s"],
  ["Infinity", "0s"],
  ["-Infinity", "0s"],
  ["36000", "10h"],
  ["359999", "99h59m59s"],
]

describe("formatSecondsToHMS golden", () => {
  it.each(HMS)("%s -> %s", (input, expected) => {
    expect(formatSecondsToHMS(Number(input))).toBe(expected)
  })
})

describe("formatSecondsToFragment golden", () => {
  it.each(FRAGMENT)("%s -> %s", (input, expected) => {
    expect(formatSecondsToFragment(Number(input))).toBe(expected)
  })
})
