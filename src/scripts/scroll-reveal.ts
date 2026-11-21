const targets = document.querySelectorAll<HTMLElement>("[data-scroll-reveal]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (
  targets.length &&
  !reducedMotion.matches &&
  "IntersectionObserver" in window
) {
  const revealInset = Math.min(320, Math.round(window.innerHeight * 0.22));
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.replace("is-reveal-pending", "is-entering");
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: `0px 0px -${revealInset}px 0px` },
  );

  for (const target of targets) {
    if (target.getBoundingClientRect().top >= window.innerHeight) {
      target.classList.add("is-reveal-pending");
      observer.observe(target);
    }
  }
}
