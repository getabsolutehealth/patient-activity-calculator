/**
 * Minimal DOM helper. Avoids React/Lit dependency while keeping component
 * code readable. Two functions:
 *
 *   el("button", { class: "foo", onclick: handler }, "Click me")
 *   frag(child1, child2, ...)
 *
 * No virtual DOM. No reconciliation. Components own their elements and call
 * targeted updates when state changes.
 *
 * Why not innerHTML: never inject user-provided strings as HTML. Practice
 * info comes from the user — set it via textContent, never innerHTML.
 */

type Attrs = Record<string, string | number | boolean | EventListener | null | undefined>;
type Child = Node | string | null | undefined | false;

/**
 * Create an HTML element with attributes and children.
 *
 * Attribute conventions:
 *   - `class`         → sets className (alias for ergonomics)
 *   - `for`           → sets htmlFor (label[for] support)
 *   - `onclick`/etc.  → registers event listener (lowercase event name)
 *   - boolean true    → sets attribute with empty string ("disabled", "required")
 *   - boolean false   → omits attribute
 *   - null/undefined  → omits attribute
 *   - any other       → sets attribute (string-coerced)
 *
 * Children: strings are appended as text nodes (safe — never parsed as HTML);
 * Nodes are appended directly; falsy values are skipped.
 */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Attrs,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);

  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value === null || value === undefined || value === false) continue;

      if (key === "class") {
        node.className = String(value);
      } else if (key === "for") {
        // label[for] — use htmlFor on the IDL side.
        (node as unknown as { htmlFor: string }).htmlFor = String(value);
      } else if (key.startsWith("on") && typeof value === "function") {
        const eventName = key.slice(2).toLowerCase();
        node.addEventListener(eventName, value);
      } else if (value === true) {
        node.setAttribute(key, "");
      } else {
        node.setAttribute(key, String(value));
      }
    }
  }

  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    if (typeof child === "string") {
      node.append(document.createTextNode(child));
    } else {
      node.append(child);
    }
  }

  return node;
}

/** Append a sequence of children — for cases where you want a list of nodes without a wrapping element. */
export function frag(...children: Child[]): DocumentFragment {
  const f = document.createDocumentFragment();
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    if (typeof child === "string") {
      f.append(document.createTextNode(child));
    } else {
      f.append(child);
    }
  }
  return f;
}
