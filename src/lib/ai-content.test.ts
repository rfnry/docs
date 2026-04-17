import { describe, it, expect } from "vitest";
import {
  sliceSections,
  buildContextHeader,
  stripFrontmatter,
} from "./ai-content";

describe("stripFrontmatter", () => {
  it("removes YAML frontmatter block at the top", () => {
    const input = "---\ntitle: x\n---\n\n# Hello\n\nBody.";
    expect(stripFrontmatter(input)).toBe("# Hello\n\nBody.");
  });

  it("is a no-op when no frontmatter is present", () => {
    expect(stripFrontmatter("# Hello")).toBe("# Hello");
  });
});

describe("sliceSections", () => {
  it("returns one section per ## heading, including up to the next ##", () => {
    const md = [
      "# Title",
      "",
      "Intro paragraph.",
      "",
      "## Install",
      "",
      "Run npm install.",
      "",
      "### Options",
      "",
      "More detail.",
      "",
      "## Verify",
      "",
      "Run verify.",
    ].join("\n");
    const sections = sliceSections(md);
    expect(sections).toHaveLength(2);
    expect(sections[0].heading).toBe("Install");
    expect(sections[0].anchor).toBe("install");
    expect(sections[0].markdown).toContain("### Options");
    expect(sections[0].markdown).not.toContain("## Verify");
    expect(sections[1].heading).toBe("Verify");
  });

  it("returns an empty array when no ## headings exist", () => {
    const md = "# Title\n\nOnly intro.";
    expect(sliceSections(md)).toEqual([]);
  });

  it("slugs heading text lowercase with hyphens", () => {
    const md = "# T\n\n## Getting Started With rfnry\n\nText.";
    const sections = sliceSections(md);
    expect(sections[0].anchor).toBe("getting-started-with-rfnry");
  });
});

describe("buildContextHeader", () => {
  it("includes source, version, locale", () => {
    const header = buildContextHeader({
      url: "https://docs.example/en/v1/guides/installation/",
      version: "v1",
      locale: "en",
    });
    expect(header).toContain("Source: https://docs.example/en/v1/guides/installation/");
    expect(header).toContain("Version: v1");
    expect(header).toContain("Locale: en");
  });

  it("includes an anchor when provided", () => {
    const header = buildContextHeader({
      url: "https://docs.example/en/v1/x/",
      version: "v1",
      locale: "en",
      anchor: "verify",
    });
    expect(header).toContain("Anchor: #verify");
  });
});
