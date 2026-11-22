export function enhanceGuestSelector(select: HTMLSelectElement) {
  const field = select.parentElement;
  const label = field?.querySelector("label");
  const trigger = field?.querySelector<HTMLButtonElement>(
    ".booking-guests-trigger",
  );
  const value = trigger?.querySelector("span");
  const panel = field?.querySelector<HTMLElement>(".booking-guests-options");
  if (!label || !trigger || !value || !panel || !panel.showPopover) return;

  const positionPanel = () => {
    const { left, top, bottom, width } = trigger.getBoundingClientRect();
    const gap = 6;
    const edge = 8;
    const maxHeight = 280;
    const below = window.innerHeight - bottom - gap - edge;
    const above = top - gap - edge;
    const openAbove =
      below < Math.min(maxHeight, panel.scrollHeight) && above > below;
    Object.assign(panel.style, {
      left: `${left}px`,
      width: `${width}px`,
      top: openAbove ? "auto" : `${bottom + gap}px`,
      bottom: openAbove ? `${window.innerHeight - top + gap}px` : "auto",
      maxHeight: `${Math.max(0, Math.min(maxHeight, openAbove ? above : below))}px`,
    });
  };

  const sync = () => {
    value.textContent = select.selectedOptions[0]?.label ?? "";
    for (const option of panel.querySelectorAll<HTMLElement>("[role=option]")) {
      option.setAttribute(
        "aria-selected",
        String(option.dataset.value === select.value),
      );
    }
  };

  const updateOptions = () => {
    if (panel.matches(":popover-open")) panel.hidePopover();
    panel.replaceChildren(
      ...Array.from(select.options, (choice) => {
        const option = document.createElement("button");
        option.type = "button";
        option.tabIndex = -1;
        option.setAttribute("role", "option");
        option.dataset.value = choice.value;
        option.textContent = choice.label;
        return option;
      }),
    );
    trigger.disabled = select.options.length === 0;
    sync();
  };

  panel.addEventListener("toggle", () => {
    const open = panel.matches(":popover-open");
    trigger.setAttribute("aria-expanded", String(open));
    if (!open) return;
    positionPanel();
    panel.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
  });

  panel.addEventListener("click", (event) => {
    const option = (event.target as Element).closest<HTMLElement>(
      "[role=option]",
    );
    if (!option?.dataset.value) return;
    select.value = option.dataset.value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    panel.hidePopover();
    trigger.focus({ preventScroll: true });
  });

  panel.addEventListener("keydown", (event) => {
    const options = [...panel.querySelectorAll<HTMLElement>("[role=option]")];
    const current = options.indexOf(document.activeElement as HTMLElement);
    let next: number;

    switch (event.key) {
      case "ArrowDown":
        next = Math.min(current + 1, options.length - 1);
        break;
      case "ArrowUp":
        next = Math.max(current - 1, 0);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = options.length - 1;
        break;
      case "Tab":
        requestAnimationFrame(() => {
          if (panel.matches(":popover-open")) panel.hidePopover();
        });
        return;
      default:
        return;
    }

    event.preventDefault();
    options[next]?.focus();
  });

  document.addEventListener("pointerdown", (event) => {
    if (
      !panel.matches(":popover-open") ||
      event.composedPath().includes(trigger)
    )
      return;

    // Native scrollbar presses can be retargeted outside the popover.
    const { left, right, top, bottom } = panel.getBoundingClientRect();
    const { clientX, clientY } = event;
    if (clientX < left || clientX > right || clientY < top || clientY > bottom)
      panel.hidePopover();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !panel.matches(":popover-open")) return;
    event.preventDefault();
    panel.hidePopover();
    trigger.focus({ preventScroll: true });
  });

  for (const event of ["resize", "scroll"]) {
    window.addEventListener(
      event,
      () => {
        if (panel.matches(":popover-open")) positionPanel();
      },
      { passive: true },
    );
  }

  select.addEventListener("change", sync);
  select.hidden = true;
  label.htmlFor = trigger.id = "booking-guests-trigger";
  trigger.hidden = false;
  panel.hidden = false;
  updateOptions();
  return updateOptions;
}
