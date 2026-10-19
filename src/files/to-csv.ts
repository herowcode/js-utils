export interface IToCSVOptions {
  /** Header labels. With object rows they also select and order the columns (keys). */
  headers?: readonly string[]
  /** Field delimiter. Default `","`. */
  delimiter?: string
  /** Record separator. Default `"\r\n"`. */
  eol?: string
  /** Prepend a UTF-8 BOM so Excel detects the encoding. Default `false`. */
  bom?: boolean
  /** Prefix string cells that start with `= + - @`, tab or CR with `'` (spreadsheet formula injection). Default `true`. */
  neutralizeFormulas?: boolean
}

type TRow = readonly unknown[] | Readonly<Record<string, unknown>>

const NUMERIC = /^[+-]?\d+(\.\d+)?$/
const FORMULA_START = /^[=+\-@\t\r]/

function stringify(value: unknown, neutralize: boolean): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "number")
    return Number.isFinite(value) ? String(value) : ""
  if (typeof value === "bigint" || typeof value === "boolean")
    return String(value)
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString()
  }
  const text = typeof value === "string" ? value : (JSON.stringify(value) ?? "")
  return neutralize && FORMULA_START.test(text) && !NUMERIC.test(text)
    ? `'${text}`
    : text
}

/**
 * Serializes rows (arrays or objects) to RFC 4180 CSV, neutralizing spreadsheet formulas.
 * @example toCSV([{ a: 1, b: "x,y" }]) // 'a,b\r\n1,"x,y"'
 */
export function toCSV(
  rows: readonly TRow[],
  {
    headers,
    delimiter = ",",
    eol = "\r\n",
    bom = false,
    neutralizeFormulas = true,
  }: IToCSVOptions = {},
): string {
  const quote = (field: string) =>
    field.includes(delimiter) || /["\r\n]/.test(field)
      ? `"${field.replace(/"/g, '""')}"`
      : field

  const isObjectRow = (row: TRow): row is Readonly<Record<string, unknown>> =>
    !Array.isArray(row)

  const columns =
    headers ??
    (rows.some(isObjectRow)
      ? Array.from(
          new Set(rows.filter(isObjectRow).flatMap((row) => Object.keys(row))),
        )
      : undefined)

  const lines: string[][] = []
  if (columns)
    lines.push(columns.map((h) => stringify(String(h), neutralizeFormulas)))
  for (const row of rows) {
    const cells = isObjectRow(row)
      ? (columns ?? Object.keys(row)).map((key) => row[key])
      : row
    lines.push(Array.from(cells, (cell) => stringify(cell, neutralizeFormulas)))
  }

  const body = lines.map((line) => line.map(quote).join(delimiter)).join(eol)
  return bom ? `﻿${body}` : body
}
