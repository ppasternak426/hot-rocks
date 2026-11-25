import { bookingSteps, formatSamplePrice } from "../data/booking-demo";
import type { DemoService as Service } from "../data/sessions";
import { enhanceGuestSelector } from "./booking-guests";
import {
  checkPayment,
  paymentMessages,
  readPaymentReturn,
  stripeCheckoutUrl,
} from "./booking-payment";

type Step = (typeof bookingSteps)[number]["id"] | "payment";

interface Slot {
  id: string;
  date: string;
  time: string;
  remaining: number;
  amount?: number;
}

interface Selection {
  slot: Slot;
  service: Service;
  guests: number;
}

const dateLabel = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "full",
  timeZone: "UTC",
});
const shortDateLabel = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const monthLabel = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const nextLabel: Record<Step, string> = {
  session: "Choose date and time",
  time: "Continue to guest details",
  details: "Review booking",
  review: "Continue to Stripe",
  payment: "",
};
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const estimatedTotal = (service: Service, guests: number) =>
  service.samplePrice * (service.billing === "person" ? guests : 1);

const asDate = (date: string) => new Date(`${date}T12:00:00Z`);
const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const firstOfMonth = (date: Date, offset = 0) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1, 12));
const today = () =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/London",
    dateStyle: "short",
  }).format(new Date());

function isSlot(item: unknown): item is Slot {
  return (
    typeof item === "object" &&
    item !== null &&
    "id" in item &&
    typeof item.id === "string" &&
    "date" in item &&
    typeof item.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
    "time" in item &&
    typeof item.time === "string" &&
    /^\d{2}:\d{2}$/.test(item.time) &&
    "remaining" in item &&
    typeof item.remaining === "number" &&
    Number.isInteger(item.remaining) &&
    (!("amount" in item) ||
      (typeof item.amount === "number" &&
        Number.isSafeInteger(item.amount) &&
        item.amount > 0))
  );
}

function initialiseBooking(form: HTMLFormElement) {
  const services: Service[] = JSON.parse(form.dataset.services ?? "[]");
  const api = form.dataset.api;
  const get = <T extends Element>(selector: string) => {
    const element = form.querySelector<T>(selector);
    if (!element) throw new Error(`Missing booking control: ${selector}`);
    return element;
  };
  const panels = form.querySelectorAll<HTMLFieldSetElement>(
    "[data-booking-step]",
  );
  const guests = get<HTMLSelectElement>("#booking-guests");
  const syncGuests = enhanceGuestSelector(guests);
  const dates = get<HTMLElement>("[data-booking-dates]");
  const times = get<HTMLElement>("[data-booking-times]");
  const dateStatus = get<HTMLElement>("[data-booking-date-status]");
  const availabilityContact = get<HTMLAnchorElement>(
    "[data-booking-availability-contact]",
  );
  const timeCaption = get<HTMLElement>("[data-booking-times-caption]");
  const timeStatus = get<HTMLElement>("[data-booking-times-status]");
  const submitError = get<HTMLElement>("[data-booking-submit-error]");
  const submitStatus = get<HTMLElement>("[data-booking-submit-status]");
  const slotError = get<HTMLElement>("[data-booking-slot-error]");
  const next = get<HTMLButtonElement>("[data-booking-next]");
  const name = get<HTMLInputElement>("#booking-name");
  const email = get<HTMLInputElement>("#booking-email");
  const progress = get<HTMLElement>(".booking-progress");

  let active: Step = "session";
  let slots: Slot[] = [];
  let calendarMonth = firstOfMonth(asDate(today()));
  let selectedDay = "";
  let selectedSlot = "";
  let selection: Selection | undefined;
  let availability: AbortController | undefined;
  let refreshingTimes = false;
  let timeNotice = "";
  let timeAnimation: Animation | undefined;
  let saving = false;
  let attempt = "";
  let requestFingerprint = "";
  let quotedTotal: number | undefined;
  let paymentReturn = readPaymentReturn(new URLSearchParams(location.search));
  let pickAnotherTime = false;

  const currentService = () =>
    services.find(
      ({ id }) =>
        id ===
        form.querySelector<HTMLInputElement>('input[name="service"]:checked')
          ?.value,
    );
  function setGuests(service: Service, count = service.minGuests) {
    guests.replaceChildren(
      ...Array.from(
        { length: service.maxGuests - service.minGuests + 1 },
        (_, index) => {
          const value = String(service.minGuests + index);
          return new Option(value, value);
        },
      ),
    );
    guests.value = String(count);
    syncGuests?.();
  }

  function renderTimes(direction?: number) {
    const candidates = slots.filter(({ date }) => date === selectedDay);
    timeAnimation?.cancel();
    times.setAttribute("aria-busy", String(refreshingTimes));
    times.replaceChildren(
      ...candidates.map((slot) => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "time";
        input.value = slot.id;
        input.checked = selectedSlot === slot.id;
        input.disabled = refreshingTimes;
        label.append(input, slot.time);
        return label;
      }),
    );
    const count = candidates.length;
    renderTimeCaption(count);
    if (active === "time") next.disabled = refreshingTimes || !selectedSlot;
    renderSummary();

    if (
      direction !== undefined &&
      count &&
      !refreshingTimes &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      timeAnimation = times.animate(
        [
          {
            opacity: direction ? 0.95 : 0.68,
            translate: `${direction * 5}px 0`,
          },
          { opacity: 1, translate: "0 0" },
        ],
        { duration: 180, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
      );
    }
  }

  function renderTimeCaption(count: number) {
    const date = selectedDay ? shortDateLabel.format(asDate(selectedDay)) : "";
    const heading = date
      ? `Times for ${date}`
      : "Choose a date to see its times.";
    timeCaption.textContent = timeNotice || heading;
    timeStatus.textContent = refreshingTimes
      ? `Checking availability for ${guestCountLabel()}.`
      : timeNotice ||
        (date
          ? `${count} ${count === 1 ? "time" : "times"} available for ${date}.`
          : "");
  }

  function guestCountLabel() {
    return `${guests.value} ${guests.value === "1" ? "guest" : "guests"}`;
  }

  function renderCalendar() {
    const month = isoDate(calendarMonth).slice(0, 7);
    get("[data-booking-month]").textContent = monthLabel.format(calendarMonth);
    const available = new Set(slots.map(({ date }) => date));
    const first = (calendarMonth.getUTCDay() + 6) % 7;
    const length = new Date(
      Date.UTC(
        calendarMonth.getUTCFullYear(),
        calendarMonth.getUTCMonth() + 1,
        0,
      ),
    ).getUTCDate();
    const days = Array.from({ length }, (_, index) => {
      const date = `${month}-${String(index + 1).padStart(2, "0")}`;
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = String(index + 1);
      button.dataset.bookingDay = date;
      button.disabled = !available.has(date);
      button.setAttribute("aria-label", dateLabel.format(asDate(date)));
      button.setAttribute("aria-pressed", String(date === selectedDay));
      button.setAttribute("aria-controls", times.id);
      return button;
    });
    const headers = weekdays.map((day) => {
      const label = document.createElement("span");
      label.textContent = day;
      label.setAttribute("aria-hidden", "true");
      return label;
    });
    dates.replaceChildren(
      ...headers,
      ...Array.from({ length: first }, () => document.createElement("span")),
      ...days,
    );
    dates.inert = refreshingTimes;
    get<HTMLButtonElement>('[data-booking-action="previous-month"]').disabled =
      refreshingTimes || month <= today().slice(0, 7);
    const horizon = asDate(today());
    horizon.setUTCDate(horizon.getUTCDate() + 89);
    get<HTMLButtonElement>('[data-booking-action="next-month"]').disabled =
      refreshingTimes || month >= isoDate(horizon).slice(0, 7);
  }

  async function loadAvailability(preferred?: Slot, keepCurrentTimes = false) {
    availability?.abort();
    const controller = new AbortController();
    availability = controller;
    const previousDay = keepCurrentTimes
      ? selectedDay
      : (preferred?.date ?? "");
    const previousSlot = keepCurrentTimes
      ? selectedSlot
      : (preferred?.id ?? "");
    if (!keepCurrentTimes) slots = [];
    selectedDay = previousDay;
    selectedSlot = previousSlot;
    refreshingTimes = true;
    timeNotice = "";
    renderCalendar();
    renderTimes();
    dateStatus.textContent = "";
    availabilityContact.hidden = true;
    const service = currentService();
    try {
      if (!api || !service) throw new Error();
      const url = new URL(api);
      url.search = new URLSearchParams({
        service: service.id,
        guests: guests.value,
      }).toString();
      const response = await fetch(url, {
        signal: controller.signal,
        cache: "no-store",
      });
      const unavailable = response.status === 404;
      if (!response.ok && !unavailable) throw new Error();
      const result: unknown = unavailable ? [] : await response.json();
      if (!Array.isArray(result) || !result.every(isSlot)) throw new Error();
      if (controller.signal.aborted) return;
      slots = result;
      const restored = slots.find(({ id }) => id === previousSlot);
      const first = restored ?? slots[0];
      selectedDay = slots.some(({ date }) => date === previousDay)
        ? previousDay
        : "";
      selectedSlot = restored?.id ?? "";
      if (previousDay && !selectedDay) {
        timeNotice = `No times for ${guestCountLabel()} on ${shortDateLabel.format(asDate(previousDay))}. Choose another date.`;
      } else if (previousSlot && !restored) {
        timeNotice = `That time is unavailable for ${guestCountLabel()}. Choose another time.`;
      }
      const visibleDay = selectedDay || (!keepCurrentTimes ? first?.date : "");
      if (visibleDay) {
        calendarMonth = firstOfMonth(asDate(visibleDay));
      }
      dateStatus.textContent = first
        ? ""
        : unavailable
          ? "Online booking is unavailable for this session."
          : "No slots fit this group. Try another guest count or session.";
      availabilityContact.hidden = Boolean(first);
    } catch {
      if (!controller.signal.aborted) {
        slots = [];
        selectedDay = "";
        selectedSlot = "";
        dateStatus.textContent =
          "Availability is temporarily unavailable. Choose the session again to retry.";
      }
    } finally {
      if (!controller.signal.aborted) {
        refreshingTimes = false;
        renderCalendar();
        renderTimes(0);
      }
    }
  }

  function renderSummary() {
    const service = currentService();
    const committed =
      selection?.service.id === service?.id ? selection : undefined;
    const slot =
      active === "time"
        ? slots.find(({ id }) => !refreshingTimes && id === selectedSlot)
        : committed?.slot;
    const day = active === "time" ? selectedDay : slot?.date;
    const count = active === "time" ? Number(guests.value) : committed?.guests;
    const sessionName = service?.name ?? "";
    const visitDate = day ? dateLabel.format(asDate(day)) : "";
    const visitTime =
      slot && count
        ? ` at ${slot.time} · ${count} ${count === 1 ? "guest" : "guests"}`
        : "";
    const title = get<HTMLElement>("[data-booking-summary-session]");
    const detail = get<HTMLElement>("[data-booking-summary-date]");
    if (title.textContent !== sessionName) title.textContent = sessionName;
    if (detail.textContent !== visitDate + visitTime) {
      detail.textContent = visitDate + visitTime;
    }
    title.hidden = !sessionName;
    detail.hidden = !visitDate;
    get<HTMLElement>("[data-booking-empty]").hidden = Boolean(service);
    get<HTMLElement>("[data-booking-totals]").hidden = !slot;
    if (slot && service && count) {
      get("[data-booking-total]").textContent = formatSamplePrice(
        (active === "time" ? undefined : quotedTotal) ??
          slot.amount ??
          estimatedTotal(service, count),
      );
    }
  }

  function show(step: Step, focus = true) {
    if (active === "time" && step !== "time") {
      availability?.abort();
      refreshingTimes = false;
      timeAnimation?.cancel();
    }
    active = step;
    for (const panel of panels) {
      panel.hidden = panel.dataset.bookingStep !== step;
      panel.disabled = panel.hidden;
    }
    const index = bookingSteps.findIndex(({ id }) => id === step);
    progress.hidden = step === "payment";
    for (const [position, { id }] of bookingSteps.entries()) {
      const item = get(`[data-booking-progress="${id}"]`);
      const editable = index > position;
      item.classList.toggle("is-complete", editable);
      get<HTMLElement>(
        `[data-booking-progress="${id}"] [data-progress-label]`,
      ).hidden = editable;
      get<HTMLButtonElement>(
        `[data-booking-progress="${id}"] [data-progress-edit]`,
      ).hidden = !editable;
      if (position === index) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    }
    get<HTMLElement>("[data-booking-actions]").hidden = step === "payment";
    get<HTMLButtonElement>('[data-booking-action="back"]').hidden =
      step === "session";
    next.textContent = nextLabel[step];
    next.disabled =
      step === "time" ? !selectedSlot : step === "session" && !services.length;
    if (step === "review")
      get("[data-booking-guest-summary]").textContent =
        `${name.value} · ${email.value}`;
    renderSummary();
    if (focus) {
      const heading = get<HTMLElement>(`[data-booking-step="${step}"] h2`);
      heading.focus({ preventScroll: true });
      (step === "payment" ? heading : progress).scrollIntoView({
        block: step === "payment" ? "nearest" : "start",
        behavior: "instant",
      });
    }
  }

  function edit(step: Step) {
    show(step);
    if (step === "time") void loadAvailability(selection?.slot);
  }

  form.addEventListener("change", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.name === "service") {
      if (selection?.service.id !== target.value) selection = undefined;
      renderSummary();
    }
    if (target === guests && active === "time") {
      selection = undefined;
      slotError.hidden = true;
      void loadAvailability(undefined, true);
    }
    if (target instanceof HTMLInputElement && target.name === "time") {
      selectedSlot = target.value;
      next.disabled = false;
      if (timeNotice) {
        timeNotice = "";
        renderTimeCaption(times.childElementCount);
      }
      renderSummary();
    }
  });

  form.addEventListener("click", (event) => {
    if (!(event.target instanceof Element) || saving) return;
    const button = event.target.closest("button");
    if (!button) return;
    const step = button.closest<HTMLElement>("[data-booking-progress]")?.dataset
      .bookingProgress;
    if (step === "session" || step === "time" || step === "details") {
      edit(step);
      return;
    }
    if (button.dataset.bookingDay) {
      const day = button.dataset.bookingDay;
      if (refreshingTimes || day === selectedDay) return;
      const direction = !selectedDay || day > selectedDay ? 1 : -1;
      selectedDay = day;
      selectedSlot = "";
      timeNotice = "";
      slotError.hidden = true;
      for (const day of dates.querySelectorAll<HTMLButtonElement>(
        "[data-booking-day]",
      )) {
        day.setAttribute("aria-pressed", String(day === button));
      }
      renderTimes(direction);
      return;
    }
    switch (button.dataset.bookingAction) {
      case "back":
        edit(
          bookingSteps[bookingSteps.findIndex(({ id }) => id === active) - 1]
            .id,
        );
        break;
      case "previous-month":
      case "next-month":
        calendarMonth = firstOfMonth(
          calendarMonth,
          button.dataset.bookingAction === "next-month" ? 1 : -1,
        );
        selectedDay = "";
        selectedSlot = "";
        timeNotice = "";
        renderCalendar();
        renderTimes();
        break;
      case "details":
        show("details");
        break;
      case "check-payment":
        void showPaymentResult();
        break;
      case "new-payment-booking": {
        const url = new URL(location.href);
        url.searchParams.delete("booking");
        url.searchParams.delete("checkout");
        history.replaceState(history.state, "", url);
        paymentReturn = undefined;
        quotedTotal = undefined;
        requestFingerprint = "";
        submitError.hidden = true;
        if (pickAnotherTime && selection) {
          setGuests(selection.service, selection.guests);
          get("[data-booking-picked-service]").textContent =
            selection.service.name;
          edit("time");
        } else {
          form.reset();
          selection = undefined;
          show("session");
        }
        break;
      }
    }
  });

  async function showPaymentResult() {
    if (!api || !paymentReturn || saving) return;
    saving = true;
    const { attempt: pendingAttempt, mode } = paymentReturn;
    const heading = get("[data-booking-payment-heading]");
    const note = get("[data-booking-payment-note]");
    const reference = get<HTMLElement>("[data-booking-payment-reference]");
    const check = get<HTMLButtonElement>(
      '[data-booking-action="check-payment"]',
    );
    const newBooking = get<HTMLButtonElement>(
      '[data-booking-action="new-payment-booking"]',
    );
    check.disabled = true;
    newBooking.hidden = true;
    let retry = false;

    try {
      for (let poll = 0; poll < 6; poll++) {
        const result = await checkPayment(
          api,
          pendingAttempt,
          mode === "cancel" && poll === 0,
        );
        if (!result) {
          heading.textContent = "Booking reference unavailable";
          note.textContent =
            "If you made a payment, contact us before booking again.";
          break;
        }
        const { status, visit } = result;
        const service = services.find(({ id }) => id === visit.service);
        if (service) {
          get<HTMLInputElement>(
            `input[name="service"][value="${CSS.escape(service.id)}"]`,
          ).checked = true;
          selection = {
            service,
            guests: visit.guests,
            slot: {
              id: visit.slot,
              date: visit.date,
              time: visit.time,
              remaining: 0,
            },
          };
          quotedTotal = visit.amount;
          renderSummary();
        }
        heading.textContent = paymentMessages[status].heading;
        note.textContent = paymentMessages[status].note;
        reference.textContent = `Booking reference ${result.reference}`;
        reference.hidden = false;
        if (status !== "pending") {
          pickAnotherTime = status === "cancelled" || status === "expired";
          newBooking.hidden = !pickAnotherTime && status !== "paid";
          newBooking.textContent = pickAnotherTime
            ? "Choose another time"
            : "Book another session";
          break;
        }
        if (poll === 5) {
          heading.textContent = "Payment still processing";
          retry = true;
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1_500));
        }
      }
    } catch {
      heading.textContent = "Payment status unavailable";
      note.textContent = "Check again before starting another booking.";
      retry = true;
    } finally {
      saving = false;
      check.disabled = false;
      check.hidden = !retry;
    }
  }

  async function startCheckout(reservation: Selection) {
    if (!api || saving) return;
    let redirecting = false;
    saving = true;
    submitError.hidden = true;
    next.disabled = true;
    next.textContent = "Opening Stripe…";
    submitStatus.textContent = next.textContent;
    const input = {
      slot: reservation.slot.id,
      service: reservation.service.id,
      guests: reservation.guests,
      name: name.value.trim(),
      email: email.value.trim(),
      action: "checkout",
      amount:
        quotedTotal ??
        reservation.slot.amount ??
        estimatedTotal(reservation.service, reservation.guests),
    };
    const fingerprint = JSON.stringify(input);
    if (requestFingerprint !== fingerprint) attempt = crypto.randomUUID();
    requestFingerprint = fingerprint;
    try {
      const response = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, attempt }),
        signal: AbortSignal.timeout(20_000),
      });
      if (response.status === 422) {
        const result: unknown = await response.json().catch(() => null);
        submitError.textContent =
          result &&
          typeof result === "object" &&
          "error" in result &&
          typeof result.error === "string" &&
          result.error.trim()
            ? result.error
            : "Check your guest details and try again.";
        submitError.hidden = false;
        return;
      }
      if (response.status === 409) {
        const result: unknown = await response.json().catch(() => null);
        const conflict = result && typeof result === "object" ? result : {};
        const updatedAmount =
          "amount" in conflict ? conflict.amount : undefined;
        if (typeof updatedAmount === "number") {
          quotedTotal = updatedAmount;
          renderSummary();
          submitError.textContent = `The total changed to ${formatSamplePrice(updatedAmount)}. Review the updated total before continuing.`;
          submitError.hidden = false;
          return;
        }
        selection = undefined;
        edit("time");
        slotError.textContent =
          "checkoutExpired" in conflict && conflict.checkoutExpired === true
            ? "Your checkout window closed. Choose an available time to try again."
            : "This slot is no longer available for your group. Choose another time.";
        slotError.hidden = false;
        return;
      }
      if (!response.ok) throw new Error();
      const result: unknown = await response.json();
      if (result && typeof result === "object") {
        const url =
          "checkoutUrl" in result
            ? stripeCheckoutUrl(result.checkoutUrl)
            : undefined;
        if (url) {
          location.assign(url.href);
          redirecting = true;
          return;
        }
        if ("checkStatus" in result && result.checkStatus === true) {
          const returnUrl = new URL(location.href);
          returnUrl.searchParams.set("booking", attempt);
          returnUrl.searchParams.set("checkout", "return");
          history.replaceState(history.state, "", returnUrl);
          paymentReturn = readPaymentReturn(returnUrl.searchParams);
          show("payment");
          return;
        }
      }
      throw new Error();
    } catch {
      submitError.textContent =
        "Stripe checkout is temporarily unavailable. Try continuing again before starting another booking.";
      submitError.hidden = false;
    } finally {
      if (!redirecting) {
        saving = false;
        submitStatus.textContent = "";
        if (active === "review") {
          next.disabled = false;
          next.textContent = nextLabel.review;
        }
        if (active === "payment") void showPaymentResult();
      }
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const service = currentService();
    const slot = slots.find(({ id }) => id === selectedSlot);
    if (active === "session" && service) {
      const previous =
        selection?.service.id === service.id ? selection : undefined;
      selection = previous;
      setGuests(service, previous?.guests);
      get("[data-booking-picked-service]").textContent = service.name;
      slotError.hidden = true;
      edit("time");
    } else if (active === "time" && service && slot && !refreshingTimes) {
      selection = { service, slot, guests: Number(guests.value) };
      quotedTotal = undefined;
      show("details");
    } else if (active === "details" && selection) {
      submitError.hidden = true;
      show("review");
    } else if (active === "review" && selection) {
      void startCheckout(selection);
    }
  });

  const requested = new URLSearchParams(window.location.search).get("session");
  for (const input of form.querySelectorAll<HTMLInputElement>(
    'input[name="service"]',
  )) {
    input.checked = input.value === requested;
  }
  form.inert = false;
  if (paymentReturn && api) {
    show("payment");
    void showPaymentResult();
  } else {
    show("session", false);
  }
  window.addEventListener("pageshow", (event) => {
    if (event.persisted && active === "review" && saving) {
      saving = false;
      next.disabled = false;
      next.textContent = nextLabel.review;
      submitStatus.textContent = "";
    }
  });
}

const form = document.querySelector("form#booking-demo");
if (form instanceof HTMLFormElement) initialiseBooking(form);
