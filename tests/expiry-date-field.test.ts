import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  buildCalendarDays,
  buildDecadeYears,
  getDecadeStart,
  ExpiryDateField
} from "@/components/inventory/expiry-date-field";

describe("expiry date picker helpers", () => {
  it("builds decade year ranges for quick long-term expiry selection", () => {
    expect(getDecadeStart(2026)).toBe(2020);
    expect(buildDecadeYears(2030)).toEqual([2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038, 2039]);
  });

  it("builds stable month grids that include leading and trailing days", () => {
    const days = buildCalendarDays(2026, 5);

    expect(days).toHaveLength(42);
    expect(days[0]).toMatchObject({ date: "2026-05-31", inCurrentMonth: false });
    expect(days.find((day) => day.date === "2026-06-16")).toMatchObject({ day: 16, inCurrentMonth: true });
  });
});

describe("ExpiryDateField", () => {
  it("renders a manual input and quick year selection controls", () => {
    vi.stubGlobal("React", React);
    const html = renderToStaticMarkup(
      createElement(ExpiryDateField, {
        name: "expiryDate",
        onChange: () => undefined,
        value: "2036-06-16"
      })
    );

    expect(html).toContain("保质期");
    expect(html).toContain("name=\"expiryDate\"");
    expect(html).toContain("快速选择年份");
    expect(html).toContain("2036");
    expect(html).toContain("选择年份");
  });
});
