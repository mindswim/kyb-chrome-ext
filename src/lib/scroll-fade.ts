/**
 * Scrollbars that only show while scrolling.
 *
 * Chrome's styled scrollbars are always-on and occupy layout width, so this
 * marks the scroll container instead of resizing anything: the thumb is
 * transparent until `is-scrolling` is set and clears once scrolling stops.
 * Width never changes, so nothing reflows when the thumb appears.
 */
export function fadeScrollbars(el: HTMLElement, source: EventTarget = el, idleMs = 800): void {
  let timer = 0;
  source.addEventListener(
    'scroll',
    () => {
      el.classList.add('is-scrolling');
      clearTimeout(timer);
      timer = window.setTimeout(() => el.classList.remove('is-scrolling'), idleMs);
    },
    { passive: true },
  );
}
