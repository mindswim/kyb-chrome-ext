/**
 * A floating pill scrollbar. The native scrollbar is hidden entirely — no
 * gutter, nothing at rest — and a thin thumb rendered over the content
 * appears while scrolling, then fades.
 *
 * Pass the window for the page scroller (the thumb is fixed to the viewport)
 * or an element (the thumb is positioned inside it and rides scrollTop so it
 * reads as fixed). Cross-origin iframes keep their own scrollbars; this only
 * styles surfaces we render.
 */
export function overlayScrollbar(target: HTMLElement | Window, idleMs = 900): void {
  const pageMode = target === window;
  const el = pageMode ? document.documentElement : (target as HTMLElement);

  const thumb = document.createElement('div');
  thumb.className = 'osb-thumb';
  if (pageMode) {
    thumb.style.position = 'fixed';
    document.body.append(thumb);
  } else {
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.append(thumb);
  }

  let timer = 0;
  const update = (): void => {
    const scrollTop = pageMode ? window.scrollY : el.scrollTop;
    const viewH = pageMode ? window.innerHeight : el.clientHeight;
    const scrollH = el.scrollHeight;
    if (scrollH - viewH < 1) {
      thumb.classList.remove('is-visible');
      return;
    }
    const height = Math.max(28, (viewH / scrollH) * viewH);
    const range = viewH - height - 8;
    const progress = scrollTop / (scrollH - viewH);
    const top = 4 + progress * range + (pageMode ? 0 : scrollTop);
    thumb.style.height = `${height}px`;
    thumb.style.transform = `translateY(${top}px)`;
    thumb.classList.add('is-visible');
    clearTimeout(timer);
    timer = window.setTimeout(() => thumb.classList.remove('is-visible'), idleMs);
  };

  (pageMode ? window : el).addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}
