import { describe, expect, it } from "vitest"
import { buildPageMeta } from "./build-page-meta"

describe("buildPageMeta", () => {
  it("describes a middle page", () => {
    expect(buildPageMeta({ page: 2, pageSize: 10, total: 25 })).toEqual({
      page: 2,
      pageSize: 10,
      total: 25,
      totalPages: 3,
      offset: 10,
      hasNext: true,
      hasPrev: true,
    })
  })

  it("flags the first and last pages", () => {
    expect(buildPageMeta({ page: 1, pageSize: 10, total: 25 })).toMatchObject({
      hasNext: true,
      hasPrev: false,
    })
    expect(buildPageMeta({ page: 3, pageSize: 10, total: 25 })).toMatchObject({
      hasNext: false,
      hasPrev: true,
    })
  })

  it("handles an exact multiple and an empty result", () => {
    expect(buildPageMeta({ page: 1, pageSize: 10, total: 20 }).totalPages).toBe(
      2,
    )
    expect(buildPageMeta({ page: 1, pageSize: 10, total: 0 })).toMatchObject({
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    })
  })

  it("keeps hasPrev for a page past the end", () => {
    expect(buildPageMeta({ page: 9, pageSize: 10, total: 25 })).toMatchObject({
      hasNext: false,
      hasPrev: true,
    })
  })

  it("clamps invalid input", () => {
    expect(buildPageMeta({ page: Number.NaN, pageSize: 0, total: -5 })).toEqual(
      {
        page: 1,
        pageSize: 1,
        total: 0,
        totalPages: 0,
        offset: 0,
        hasNext: false,
        hasPrev: false,
      },
    )
    expect(
      buildPageMeta({ page: 1, pageSize: 10, total: Number.NaN }).total,
    ).toBe(0)
  })
})
