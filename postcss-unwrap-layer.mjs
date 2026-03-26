/**
 * PostCSS plugin: unwrap @layer rules for Safari 12 compatibility.
 *
 * Safari < 15.4 does not support CSS @layer. It treats @layer blocks
 * as unknown at-rules and ignores all rules inside them.
 *
 * This plugin removes the @layer wrapper while preserving the rules
 * inside, so the CSS works on Safari 12+. The cascade order is
 * maintained by source order (Tailwind already emits CSS in the
 * correct order: theme -> base -> components -> utilities).
 *
 * For modern browsers this is a no-op in terms of rendering because
 * the source order already matches the intended layer order.
 */
const plugin = () => ({
  postcssPlugin: "postcss-unwrap-layer",
  AtRule: {
    layer(atRule) {
      // Only unwrap @layer with a block body (not bare declarations like @layer a, b, c;)
      if (atRule.nodes && atRule.nodes.length > 0) {
        // Move all children before the @layer rule, then remove the @layer
        for (const node of atRule.nodes) {
          atRule.before(node.clone());
        }
        atRule.remove();
      } else {
        // Bare @layer declaration (e.g., @layer base, components, utilities;)
        // Remove it entirely — it's only meaningful for layer ordering
        atRule.remove();
      }
    },
  },
});

plugin.postcss = true;

export default plugin;
