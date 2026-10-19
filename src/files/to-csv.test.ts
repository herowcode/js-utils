import { describe, expect, it } from "vitest"
import { toCSV } from "./to-csv"

describe("toCSV", () => {
  it("serializes object rows with a header from the keys", () => {
    expect(
      toCSV([
        { a: 1, b: "x" },
        { a: 2, b: "y" },
      ]),
    ).toBe("a,b\r\n1,x\r\n2,y")
  })

  it("unions keys across rows in first-seen order", () => {
    expect(toCSV([{ a: 1 }, { b: 2 }])).toBe("a,b\r\n1,\r\n,2")
  })

  it("uses headers to select and order object columns", () => {
    expect(toCSV([{ a: 1, b: 2, c: 3 }], { headers: ["c", "a"] })).toBe(
      "c,a\r\n3,1",
    )
  })

  it("serializes array rows without a header unless headers is set", () => {
    expect(toCSV([[1, "x"]])).toBe("1,x")
    expect(toCSV([[1, "x"]], { headers: ["n", "s"] })).toBe("n,s\r\n1,x")
  })

  it("returns an empty string for no rows", () => {
    expect(toCSV([])).toBe("")
    expect(toCSV([], { headers: ["a"] })).toBe("a")
  })

  describe("RFC 4180 quoting", () => {
    it("quotes fields with the delimiter, quotes, CR or LF and doubles quotes", () => {
      expect(toCSV([["a,b", 'say "hi"', "l1\nl2", "l1\rl2", "plain"]])).toBe(
        '"a,b","say ""hi""","l1\nl2","l1\rl2",plain',
      )
    })

    it("quotes relative to a custom delimiter", () => {
      expect(toCSV([["a;b", "c,d"]], { delimiter: ";" })).toBe('"a;b";c,d')
    })

    it("quotes header cells too", () => {
      expect(toCSV([{ "a,b": 1 }])).toBe('"a,b"\r\n1')
    })
  })

  describe("options", () => {
    it("uses a custom eol", () => {
      expect(toCSV([[1], [2]], { eol: "\n" })).toBe("1\n2")
    })

    it("prepends a BOM", () => {
      expect(toCSV([[1]], { bom: true })).toBe("﻿1")
      expect(toCSV([[1]])).toBe("1")
    })
  })

  describe("cell values", () => {
    it("turns null and undefined into empty fields", () => {
      expect(toCSV([[null, undefined, ""]])).toBe(",,")
    })

    it("serializes booleans, bigints, dates and objects", () => {
      expect(
        toCSV([
          [true, 10n, new Date("2026-01-02T03:04:05.000Z"), { a: 1 }, [1, 2]],
        ]),
      ).toBe('true,10,2026-01-02T03:04:05.000Z,"{""a"":1}","[1,2]"')
    })

    it("blanks non-finite numbers and invalid dates", () => {
      expect(
        toCSV([[Number.NaN, Number.POSITIVE_INFINITY, new Date("x")]]),
      ).toBe(",,")
    })
  })

  describe("neutralizeFormulas", () => {
    it.each(["=SUM(A1)", "+cmd", "-cmd", "@SUM(A1)", "\tcmd", "\rcmd"])(
      "prefixes %j with a single quote",
      (value) => {
        expect(toCSV([[value]]).replace(/^"|"$/g, "")).toBe(`'${value}`)
      },
    )

    it("leaves ordinary strings alone", () => {
      expect(toCSV([["hello", "a=b", "x-y", "1+1"]])).toBe("hello,a=b,x-y,1+1")
    })

    it("leaves number and bigint values untouched, including negatives", () => {
      expect(toCSV([[-12.5, -3, 0, -5n]])).toBe("-12.5,-3,0,-5")
    })

    it("exempts strings matching ^[+-]?\\d+(\\.\\d+)?$", () => {
      expect(toCSV([["-12.5", "+3", "42", "-7"]])).toBe("-12.5,+3,42,-7")
    })

    it("neutralizes numeric-looking strings outside the exemption", () => {
      expect(toCSV([["-1e3", "-.5", "+5.", "-0x1A", " -5", "-5 "]])).toBe(
        "'-1e3,'-.5,'+5.,'-0x1A, -5,'-5 ",
      )
    })

    it("neutralizes formatted pt-BR negatives", () => {
      expect(toCSV([["-1.234,56", "-R$ 12,50"]])).toBe(
        `"'-1.234,56","'-R$ 12,50"`,
      )
    })

    it("neutralizes headers", () => {
      expect(toCSV([{ "=x": 1 }])).toBe("'=x\r\n1")
    })

    it("can be disabled", () => {
      expect(toCSV([["=SUM(A1)"]], { neutralizeFormulas: false })).toBe(
        "=SUM(A1)",
      )
    })

    it("quotes after prefixing when the cell needs quoting", () => {
      expect(toCSV([["=a,b"]])).toBe(`"'=a,b"`)
    })
  })

  it("is linear on 100 KB adversarial input", () => {
    for (const cell of [
      '"'.repeat(100_000),
      ",".repeat(100_000),
      "-".repeat(100_000),
    ]) {
      const start = performance.now()
      toCSV([[cell]])
      expect(performance.now() - start).toBeLessThan(50)
    }
  })
})
