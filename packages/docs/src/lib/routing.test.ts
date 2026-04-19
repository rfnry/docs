import { describe, expect, it } from "vitest";
import { buildDocHref, parseEntryId } from "./routing";

describe("parseEntryId", () => {
  it("parses a nested path", () => {
    expect(parseEntryId("v1/en/guides/installation")).toEqual({
      version: "v1",
      locale: "en",
      slug: "guides/installation",
    });
  });

  it("parses an index entry (no slug after locale)", () => {
    expect(parseEntryId("v1/en/index")).toEqual({
      version: "v1",
      locale: "en",
      slug: "",
    });
  });

  it("handles a hyphenated locale", () => {
    expect(parseEntryId("v2/pt-br/guides/quickstart")).toEqual({
      version: "v2",
      locale: "pt-br",
      slug: "guides/quickstart",
    });
  });

  it("throws on a path too short to contain version + locale", () => {
    expect(() => parseEntryId("v1")).toThrow();
  });
});

describe("buildDocHref", () => {
  it("builds a root href with trailing slash", () => {
    expect(buildDocHref({ version: "v1", locale: "en", slug: "" })).toBe("/en/v1/");
  });

  it("builds a nested href", () => {
    expect(buildDocHref({ version: "v1", locale: "en", slug: "guides/installation" })).toBe(
      "/en/v1/guides/installation/",
    );
  });
});
