import { describe, expect, it } from "vitest";
import { buildSidebarTree, type GroupMeta, type SidebarEntry } from "./sidebar";

const make = (id: string, title: string, order = 100, hidden = false): SidebarEntry => ({
  id,
  title,
  order,
  hidden,
});

describe("buildSidebarTree", () => {
  it("returns a flat list when there are no folders", () => {
    const entries = [make("react/v1/en/index", "Home", 1), make("react/v1/en/about", "About", 2)];
    const tree = buildSidebarTree({ pkg: "react", version: "v1", locale: "en", entries, groups: new Map() });
    expect(tree.map((n) => n.label)).toEqual(["Home", "About"]);
    expect(tree[0].href).toBe("/en/react/v1/");
    expect(tree[1].href).toBe("/en/react/v1/about/");
  });

  it("nests entries under folders using _group.yaml metadata", () => {
    const entries = [
      make("react/v1/en/index", "Home", 1),
      make("react/v1/en/guides/installation", "Install", 1),
      make("react/v1/en/guides/quickstart", "Quickstart", 2),
    ];
    const groups = new Map<string, GroupMeta>([["guides", { label: "Guides", order: 2, collapsed: false }]]);
    const tree = buildSidebarTree({ pkg: "react", version: "v1", locale: "en", entries, groups });
    expect(tree).toHaveLength(2);
    expect(tree[0].label).toBe("Home");
    expect(tree[1].label).toBe("Guides");
    expect(tree[1].children?.map((c) => c.label)).toEqual(["Install", "Quickstart"]);
  });

  it("filters out hidden entries", () => {
    const entries = [make("react/v1/en/index", "Home", 1), make("react/v1/en/secret", "Secret", 2, true)];
    const tree = buildSidebarTree({ pkg: "react", version: "v1", locale: "en", entries, groups: new Map() });
    expect(tree).toHaveLength(1);
  });

  it("humanizes folder names when no _group.yaml exists", () => {
    const entries = [make("react/v1/en/api-reference/client", "Client", 1)];
    const tree = buildSidebarTree({ pkg: "react", version: "v1", locale: "en", entries, groups: new Map() });
    expect(tree[0].label).toBe("Api reference");
  });

  it("only returns entries for the requested package, version, and locale", () => {
    const entries = [
      make("react/v1/en/index", "React EN", 1),
      make("react/v1/pt-br/index", "React PT", 1),
      make("react/v2/en/index", "React v2", 1),
      make("python/v1/en/index", "Python EN", 1),
    ];
    const tree = buildSidebarTree({ pkg: "react", version: "v1", locale: "en", entries, groups: new Map() });
    expect(tree).toHaveLength(1);
    expect(tree[0].label).toBe("React EN");
  });
});
