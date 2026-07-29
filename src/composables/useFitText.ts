import { onUnmounted, type ComponentPublicInstance } from "vue";

/**
 * Shrinks an element's text until it fits its own box.
 *
 * The bands place copy in boxes sized from the artwork, but the copy itself comes
 * from `useWedding()` and can be any length. Worse, the boxes scale with the
 * viewport: at a narrow width the font gets small enough that glyph advances no
 * longer round the same way, the text picks up an extra line, and it spills past
 * the card it is printed on. So the box height is the constraint and the type
 * gives way -- never the other way round.
 *
 * Drive it with a `--fit` multiplier the CSS already applies to `font-size`, so
 * nothing here writes a px value and the design's own units stay in charge:
 *
 *   const fit = useFitText()
 *   <p :ref="fit" class="...">        // needs a fixed height in CSS
 *   font-size: calc(10 * var(--px) * var(--fit, 1));
 */
const MIN_SCALE = 0.72;
const STEP = 0.02;

export function useFitText(): (node: Element | ComponentPublicInstance | null) => void {
  let observer: ResizeObserver | null = null;
  let visibility: IntersectionObserver | null = null;

  function fit(node: HTMLElement): void {
    // No box yet — the band is still behind the cover. Measuring now would report
    // 0 and lock in a scale of 1; the observers below refit once it is rendered.
    if (!node.clientHeight) return;

    let scale = 1;
    node.style.setProperty("--fit", "1");
    // A fractional pixel of slack stops a rounding wobble from looping forever.
    while (node.scrollHeight > node.clientHeight + 1 && scale > MIN_SCALE) {
      scale -= STEP;
      node.style.setProperty("--fit", String(scale));
    }
  }

  function disconnect(): void {
    observer?.disconnect();
    observer = null;
    visibility?.disconnect();
    visibility = null;
  }

  onUnmounted(disconnect);

  return (node) => {
    disconnect();
    if (!(node instanceof HTMLElement)) return;

    // Refit on resize, but never inside the callback that fired it: changing the
    // font size resizes the element and would re-enter the observer.
    observer = new ResizeObserver(() => requestAnimationFrame(() => fit(node)));
    observer.observe(node);

    // The invitation sits behind the cover under `v-show`, so this element has no
    // box until the cover is dismissed -- and a ResizeObserver does not report an
    // element going from display:none to rendered. This does.
    visibility = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) requestAnimationFrame(() => fit(node));
    });
    visibility.observe(node);

    fit(node);

    // The box has a fixed height, so swapping in the real webfont reflows the text
    // without resizing the element -- the observer never fires and the first fit,
    // measured against the fallback face, is the one that sticks.
    document.fonts?.ready.then(() => fit(node));
  };
}
