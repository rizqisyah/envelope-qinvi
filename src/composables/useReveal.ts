import { onUnmounted, ref, type ComponentPublicInstance, type Ref } from "vue";

/**
 * Flips `shown` the first time the element scrolls into view.
 * Section entrance animations are gated on this so each one fires on scroll,
 * not all at load.
 *
 * `el` is a callback ref, not a `ref()` holding the node: a plain ref would have
 * to be bound as `ref="el"`, which `noUnusedLocals` reads as never used.
 *
 *   const { el, shown } = useReveal()
 *   <section :ref="el" :class="{ 'is-in': shown }">
 */
export function useReveal(threshold = 0.2): {
  el: (node: Element | ComponentPublicInstance | null) => void;
  shown: Ref<boolean>;
} {
  const shown = ref(false);
  let obs: IntersectionObserver | null = null;

  function disconnect(): void {
    obs?.disconnect();
    obs = null;
  }

  function el(node: Element | ComponentPublicInstance | null): void {
    disconnect();
    if (!(node instanceof Element) || shown.value) return;

    obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          shown.value = true;
          disconnect();
        }
      },
      { threshold }
    );
    obs.observe(node);
  }

  onUnmounted(disconnect);

  return { el, shown };
}
