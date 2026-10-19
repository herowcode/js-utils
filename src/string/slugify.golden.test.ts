import { describe, expect, it } from "vitest"
import { slugify } from "./slugify"

const CASES: [string, string][] = [
  ["Hello World", "hello-world"],
  ["  Olá, Mundo! ", "ola-mundo"],
  ["Ação  & Reação", "acao-reacao"],
  ["Crème Brûlée", "creme-brulee"],
  ["a_b-c d", "a_bc-d"],
  ["  ", ""],
  ["", ""],
  ["日本語 test", "test"],
  ["Ünï  cödé 123", "uni-code-123"],
  ["--x--", "x"],
  ["Tab\tnew\nline", "tab-new-line"],
]

describe("slugify golden", () => {
  it.each(CASES)("%j -> %j", (input, expected) => {
    expect(slugify(input)).toBe(expected)
  })
})
