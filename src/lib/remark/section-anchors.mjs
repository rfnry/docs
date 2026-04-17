import { visit } from "unist-util-visit";

export default function rehypeSectionAnchors() {
  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "h2") return;
      const id = node.properties?.id;
      if (typeof id !== "string") return;
      node.properties = {
        ...(node.properties ?? {}),
        "data-section-heading": id,
      };
    });
  };
}
