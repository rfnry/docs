import { describe, expect, it } from "vitest";
import { buildDocHref, parseEntryId } from "./routing";

describe("parseEntryId", () => {
  it("parses a nested path", () => {
    expect(parseEntryId("react/v1/en/guides/installation")).toEqual({
      pkg: "react",
      version: "v1",
      locale: "en",
      slug: "guides/installation",
    });
  });

  it("parses an index entry (no slug after locale)", () => {
    expect(parseEntryId("react/v1/en/index")).toEqual({
      pkg: "react",
      version: "v1",
      locale: "en",
      slug: "",
    });
  });

  it("handles a hyphenated locale", () => {
    expect(parseEntryId("python/v2/pt-br/guides/quickstart")).toEqual({
      pkg: "python",
      version: "v2",
      locale: "pt-br",
      slug: "guides/quickstart",
    });
  });

  it("throws on a path too short to contain package + version + locale", () => {
    expect(() => parseEntryId("react/v1")).toThrow();
  });
});

describe("buildDocHref", () => {
  it("builds a root href with trailing slash", () => {
    expect(buildDocHref({ pkg: "react", version: "v1", locale: "en", slug: "" })).toBe("/en/react/v1/");
  });

  it("builds a nested href", () => {
    expect(buildDocHref({ pkg: "react", version: "v1", locale: "en", slug: "guides/installation" })).toBe(
      "/en/react/v1/guides/installation/",
    );
  });
});
