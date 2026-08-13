/** Tiny element builder shared by the panel and the demo harness. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  children?: (Node | string)[],
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) el.className = className;
  for (const child of children ?? []) el.append(child);
  return el;
}
