import {
  bookingSteps,
  demoCoupon,
  demoGuest,
  demoTimes,
  formatSamplePrice,
} from "../data/booking-demo";
import type { DemoService as Service } from "../data/sessions";
import { enhanceGuestSelector } from "./booking-guests";

type Step = (typeof bookingSteps)[number]["id"] | "complete";
type CheckoutStep = "details" | "review";

interface Reservation {
  id: number;
  service: Service;
  day: number;
  time: string;
  guests: number;
}

const dateLabel = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const sampleDays = demoTimes.map((times, index) => {
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + index + 1);
  return { date, times, label: dateLabel.format(date) };
});

const nextLabel: Record<Step, string> = {
  session: "Choose date and time",
  time: "Continue to guest details",
  details: "Review booking",
  review: "Complete demo booking",
  complete: "",
};

function sampleCost(service: Service, guests: number) {
  return service.samplePrice * (service.billing === "person" ? guests : 1);
}

function choice(name: string, value: string, text: string) {
  const label = document.createElement("label");
  const input = document.createElement("input");
  input.type = "radio";
  input.name = name;
  input.value = value;
  input.required = true;
  label.append(input, text);
  return label;
}

function downloadCalendar(reservations: Reservation[]) {
  const compactDate = (date: Date) =>
    date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d+Z$/, "Z");
  const sampleId = Date.now();
  const events = reservations.flatMap(({ id, service, day, time }) => {
    const isoDay = sampleDays[day].date.toISOString().slice(0, 10);
    // Date arithmetic here uses UTC as a representation of the sample UK wall time.
    const start = new Date(`${isoDay}T${time}:00Z`);
    const end = new Date(start.valueOf() + service.minutes * 60_000);
    return [
      "BEGIN:VEVENT",
      `UID:${sampleId}-${id}@hot-rocks-demo.example`,
      `DTSTAMP:${compactDate(new Date())}`,
      `DTSTART;TZID=Europe/London:${compactDate(start).slice(0, -1)}`,
      `DTEND;TZID=Europe/London:${compactDate(end).slice(0, -1)}`,
      `SUMMARY:DEMO - ${service.name
        .replaceAll("\\", "\\\\")
        .replace(/\r\n?|\n/g, "\\n")
        .replace(/[;,]/g, "\\$&")}`,
      "LOCATION:Gawley's Gate",
      "DESCRIPTION:Sample Hot Rocks booking. No reservation was made.",
      "STATUS:TENTATIVE",
      "END:VEVENT",
    ];
  });
  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Hot Rocks Sauna//Booking Demo//EN",
    "BEGIN:VTIMEZONE",
    "TZID:Europe/London",
    "BEGIN:DAYLIGHT",
    "DTSTART:19700329T010000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
    "TZOFFSETFROM:+0000",
    "TZOFFSETTO:+0100",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "DTSTART:19701025T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
    "TZOFFSETFROM:+0100",
    "TZOFFSETTO:+0000",
    "END:STANDARD",
    "END:VTIMEZONE",
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
  const url = URL.createObjectURL(
    new Blob([calendar], { type: "text/calendar;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "hot-rocks-sample-booking.ics";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function initialiseBooking(form: HTMLFormElement) {
  const services: Service[] = JSON.parse(form.dataset.services ?? "[]");
  const get = <T extends Element>(selector: string) => {
    const element = form.querySelector<T>(selector);
    if (!element) throw new Error(`Missing booking control: ${selector}`);
    return element;
  };
  const panels = [
    ...form.querySelectorAll<HTMLFieldSetElement>("[data-booking-step]"),
  ];
  const progressList = get<HTMLOListElement>(".booking-progress");
  const progress = bookingSteps.map(({ id }) => {
    const selector = `[data-booking-progress="${id}"]`;
    return {
      id,
      item: get<HTMLElement>(selector),
      label: get<HTMLElement>(`${selector} [data-progress-label]`),
      button: get<HTMLButtonElement>(`${selector} [data-progress-edit]`),
    };
  });
  const actionBar = get<HTMLElement>("[data-booking-actions]");
  const next = get<HTMLButtonElement>("[data-booking-next]");
  const back = get<HTMLButtonElement>('[data-booking-action="back"]');
  const guests = get<HTMLSelectElement>("#booking-guests");
  const updateGuestOptions = enhanceGuestSelector(guests);
  const dates = get<HTMLElement>("[data-booking-dates]");
  const times = get<HTMLElement>("[data-booking-times]");
  const timeStatus = get<HTMLElement>("[data-booking-times-status]");
  const dateReset = get<HTMLElement>("[data-booking-date-reset]");
  const slotError = get<HTMLElement>("[data-booking-slot-error]");
  const cart = get<HTMLUListElement>("[data-booking-cart]");
  const add = get<HTMLButtonElement>('[data-booking-action="add"]');
  const empty = get<HTMLElement>("[data-booking-empty]");
  const draft = get<HTMLElement>("[data-booking-draft]");
  const pickedService = get<HTMLElement>("[data-booking-picked-service]");
  const totals = get<HTMLElement>("[data-booking-totals]");
  const discountRow = get<HTMLElement>("[data-booking-discount-row]");
  const coupon = get<HTMLInputElement>("#booking-coupon");
  const couponStatus = get<HTMLElement>("[data-booking-coupon-status]");
  const fullPayment = get<HTMLInputElement>('[name="pay-full"]');
  const accepted = get<HTMLInputElement>('[name="terms"]');
  const name = get<HTMLInputElement>("#booking-name");
  const email = get<HTMLInputElement>("#booking-email");
  const phone = get<HTMLInputElement>("#booking-phone");
  const notes = get<HTMLTextAreaElement>("#booking-notes");

  let active: Step = "session";
  let returnTo: CheckoutStep = "details";
  let editId: number | undefined;
  let nextId = 1;
  let discounted = false;
  let reservations: Reservation[] = [];

  dates.replaceChildren(
    ...sampleDays.map((day, index) => choice("day", String(index), day.label)),
  );

  const selected = (name: string) =>
    form.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)
      ?.value;
  const currentService = () =>
    services.find((service) => service.id === selected("service"));
  const currentDay = () => sampleDays[Number(selected("day"))];

  function setRadio(name: string, value?: string) {
    for (const radio of form.querySelectorAll<HTMLInputElement>(
      `input[name="${name}"]`,
    )) {
      radio.checked = radio.value === value;
    }
  }

  function setGuests(service: Service, value = service.minGuests) {
    const options = Array.from(
      { length: service.maxGuests - service.minGuests + 1 },
      (_, index) => {
        const count = service.minGuests + index;
        return new Option(String(count), String(count));
      },
    );
    guests.replaceChildren(...options);
    guests.value = String(value);
    updateGuestOptions?.();
  }

  function renderTimes(chosenTime?: string) {
    const day = currentDay();
    times.replaceChildren(
      ...(day?.times ?? []).map((time) => choice("time", time, time)),
    );
    setRadio("time", chosenTime);
    timeStatus.textContent = day
      ? day.times.length
        ? ""
        : "This sample date is full. Choose another date."
      : "Choose a date to see its times.";
    slotError.hidden = true;
    if (active === "time") next.disabled = Boolean(day && !day.times.length);
  }

  function renderSummary() {
    const editable = active === "details" || active === "review";
    cart.replaceChildren(
      ...reservations.map((reservation) => {
        const item = document.createElement("li");
        const title = document.createElement("strong");
        const time = document.createElement("p");
        const price = document.createElement("p");
        title.textContent = reservation.service.name;
        time.textContent = `${sampleDays[reservation.day].label} at ${reservation.time} · ${reservation.guests} ${reservation.guests === 1 ? "guest" : "guests"}`;
        price.textContent = formatSamplePrice(
          sampleCost(reservation.service, reservation.guests),
        );
        item.append(title, time, price);
        if (editable) {
          const actions = document.createElement("div");
          actions.className = "booking-cart-actions";
          for (const action of ["edit", "remove"]) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "booking-text-button";
            button.dataset.bookingAction = action;
            button.dataset.reservation = String(reservation.id);
            button.textContent = action === "edit" ? "Edit" : "Remove";
            button.setAttribute(
              "aria-label",
              `${button.textContent} ${reservation.service.name}`,
            );
            actions.append(button);
          }
          item.append(actions);
        }
        return item;
      }),
    );
    add.hidden = !editable;
    totals.hidden = reservations.length === 0;
    empty.hidden = reservations.length > 0 || Boolean(currentService());
    renderPrice();
  }

  function renderPrice() {
    const subtotal = reservations.reduce(
      (sum, item) => sum + sampleCost(item.service, item.guests),
      0,
    );
    const discount = discounted ? Math.round(subtotal / 10) : 0;
    get("[data-booking-subtotal]").textContent = formatSamplePrice(subtotal);
    discountRow.hidden = !discount;
    get("[data-booking-discount]").textContent =
      `−${formatSamplePrice(discount)}`;
    get("[data-booking-total]").textContent = formatSamplePrice(
      subtotal - discount,
    );
    get("[data-booking-due]").textContent = formatSamplePrice(
      fullPayment.checked
        ? subtotal - discount
        : Math.round((subtotal - discount) / 4),
    );
  }

  function renderDraft() {
    const service = currentService();
    const isDraft = active === "session" || active === "time";
    draft.hidden = !service || !isDraft;
    empty.hidden = reservations.length > 0 || Boolean(service);
    if (!service || !isDraft) return;
    const count = active === "time" ? Number(guests.value) : service.minGuests;
    pickedService.textContent = service.name;
    draft.textContent = `${service.name} · ${formatSamplePrice(sampleCost(service, count))} sample price`;
  }

  function show(step: Step, focus = true) {
    active = step;
    for (const panel of panels) {
      panel.hidden = panel.dataset.bookingStep !== step;
      panel.disabled = panel.hidden;
    }
    const index = bookingSteps.findIndex((item) => item.id === step);
    for (const [position, { item, label, button }] of progress.entries()) {
      const canEdit = position < index;
      item.classList.toggle("is-complete", step === "complete" || canEdit);
      label.hidden = canEdit;
      button.hidden = !canEdit;
      if (position === index) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    }
    actionBar.hidden = step === "complete";
    back.hidden = step === "session" && reservations.length === 0;
    next.disabled =
      (step === "session" && !services.length) ||
      (step === "time" && currentDay()?.times.length === 0);
    next.textContent =
      step === "time" && returnTo === "review"
        ? "Return to review"
        : nextLabel[step];
    if (step === "review") {
      get("[data-booking-guest-summary]").textContent = [
        name.value,
        email.value,
        phone.value,
      ].join(" · ");
      const guestNotes = get<HTMLElement>("[data-booking-guest-notes]");
      guestNotes.hidden = !notes.value.trim();
      guestNotes.textContent = notes.value;
    }
    renderSummary();
    renderDraft();
    if (focus) {
      const heading = get<HTMLElement>(`[data-booking-step="${step}"] h2`);
      heading.focus({ preventScroll: true });
      progressList.scrollIntoView({ block: "start", behavior: "instant" });
    }
  }

  function loadDraft(reservation?: Reservation) {
    dateReset.hidden = true;
    editId = reservation?.id;
    setRadio("service", reservation?.service.id);
    setRadio("day", reservation ? String(reservation.day) : undefined);
    if (reservation) setGuests(reservation.service, reservation.guests);
    else {
      guests.replaceChildren();
      updateGuestOptions?.();
    }
    renderTimes(reservation?.time);
  }

  function reviseSchedule(step: "session" | "time") {
    if (active === "details" || active === "review") {
      const reservation =
        reservations.find((item) => item.id === editId) ?? reservations.at(-1);
      if (!reservation) return;
      returnTo = active;
      loadDraft(reservation);
    }
    show(step);
  }

  for (const { id, button } of progress) {
    button.addEventListener("click", () => {
      if (button.hidden) return;
      if (id === "session" || id === "time") reviseSchedule(id);
      else show(id);
    });
  }

  form.addEventListener("change", (event) => {
    const input = event.target;
    if (!(
      input instanceof HTMLInputElement || input instanceof HTMLSelectElement
    ))
      return;
    if (input.name === "service") {
      const service = currentService();
      if (service) {
        const count = Math.min(
          service.maxGuests,
          Math.max(service.minGuests, Number(guests.value)),
        );
        setGuests(service, count);
      }
      if (currentDay()) dateReset.hidden = false;
      setRadio("day");
      renderTimes();
    }
    if (input.name === "day") {
      dateReset.hidden = true;
      renderTimes();
    }
    if (input.name === "time") slotError.hidden = true;
    if (input.name === "pay-full") renderPrice();
    renderDraft();
  });

  coupon.addEventListener("input", () => {
    couponStatus.textContent = "";
    if (discounted) {
      discounted = false;
      renderPrice();
    }
  });

  form.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>(
      "[data-booking-action]",
    );
    if (!button) return;

    switch (button.dataset.bookingAction) {
      case "back":
        if (active === "session" && reservations.length) show(returnTo);
        else if (active === "time") show("session");
        else if (active === "details") reviseSchedule("time");
        else if (active === "review") show("details");
        break;
      case "add":
      case "edit": {
        const reservation = reservations.find(
          (item) => item.id === Number(button.dataset.reservation),
        );
        returnTo = active === "review" ? "review" : "details";
        loadDraft(reservation);
        show("session");
        break;
      }
      case "remove":
        reservations = reservations.filter(
          (item) => item.id !== Number(button.dataset.reservation),
        );
        accepted.checked = false;
        if (!reservations.length) {
          loadDraft();
          returnTo = "details";
          show("session");
        } else {
          renderSummary();
          get<HTMLElement>("#booking-summary-title").focus();
        }
        break;
      case "sample":
        name.value = demoGuest.name;
        email.value = demoGuest.email;
        phone.value = demoGuest.phone;
        name.focus();
        break;
      case "details":
        show("details");
        break;
      case "coupon":
        discounted = coupon.value.trim().toUpperCase() === demoCoupon;
        couponStatus.textContent = discounted
          ? "Sample discount applied."
          : `Enter ${demoCoupon} to test a coupon.`;
        renderPrice();
        break;
      case "calendar":
        downloadCalendar(reservations);
        break;
      case "restart":
        form.reset();
        reservations = [];
        discounted = false;
        couponStatus.textContent = "";
        returnTo = "details";
        loadDraft();
        show("session");
        break;
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (active === "session") {
      if (currentService()) show("time");
    } else if (active === "time") {
      const service = currentService();
      const day = Number(selected("day"));
      const time = selected("time");
      if (!service || !time || !sampleDays[day]?.times.includes(time)) return;
      if (
        reservations.some(
          (item) =>
            item.id !== editId &&
            item.service.id === service.id &&
            item.day === day &&
            item.time === time,
        )
      ) {
        slotError.textContent =
          "That slot is already in your demo. Choose another time or edit the saved session.";
        slotError.hidden = false;
        return;
      }
      const item = {
        id: editId ?? nextId++,
        service,
        day,
        time,
        guests: Number(guests.value),
      };
      reservations =
        editId === undefined
          ? [...reservations, item]
          : reservations.map((existing) =>
              existing.id === editId ? item : existing,
            );
      editId = item.id;
      accepted.checked = false;
      show(returnTo);
    } else if (active === "details" && reservations.length) {
      show("review");
    } else if (active === "review" && reservations.length && accepted.checked) {
      show("complete");
    }
  });

  const requestedSession = new URLSearchParams(window.location.search).get(
    "session",
  );
  if (requestedSession) {
    setRadio("service", requestedSession);
    const service = currentService();
    if (service) setGuests(service);
  }

  show("session", false);
  form.inert = false;

  if (requestedSession && currentService()) {
    const centerSelectedSession = () => {
      void document.fonts.ready.then(() => {
        requestAnimationFrame(() => {
          if (active !== "session" || selected("service") !== requestedSession)
            return;

          const row = form
            .querySelector('input[name="service"]:checked')
            ?.closest(".booking-service");
          if (!row) return;

          const { top, height } = row.getBoundingClientRect();
          window.scrollBy({
            top: top + (height - window.innerHeight) / 2,
            behavior: "instant",
          });
        });
      });
    };

    if (document.readyState === "complete") {
      centerSelectedSession();
    } else {
      window.addEventListener("pageshow", centerSelectedSession, {
        once: true,
      });
    }
  }
}

const form = document.querySelector("form#booking-demo");
if (form instanceof HTMLFormElement) initialiseBooking(form);
