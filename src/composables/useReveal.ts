import { onMounted, onUnmounted, ref, type Ref } from "vue";

/**
 * Adds an `in-view` flag the first time the element scrolls into view.
 * Section entrance animations are gated on this so each one fires on scroll,
 * not all at load.
 */
export function useReveal(threshold = 0.2): {
  el: Ref<HTMLElement | null>;
  shown: Ref<boolean>;
} {
  const el = ref<HTMLElement | null>(null);
  const shown = ref(false);
  let obs: IntersectionObserver | null = null;

  onMounted(() => {
    if (!el.value) return;
    obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            shown.value = true;
            obs?.disconnect();
          }
        }
      },
      { threshold }
    );
    obs.observe(el.value);
  });

  onUnmounted(() => obs?.disconnect());

  return { el, shown };
}
