import { visit } from "unist-util-visit";

/**
 * Rehype plugin: marks every H2 with data-section-heading="<anchor>" so
 * client JS can attach a Copy-for-AI button next to it.
 * Relies on rehype-slug having already assigned `id` to headings.
 */
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
