const paymentMessages = {
  pending: {
    heading: "Checking payment",
    note: "Your booking will appear here once payment is confirmed.",
  },
  paid: {
    heading: "Booking confirmed",
    note: "Keep your booking reference for your visit.",
  },
  cancelled: {
    heading: "Checkout cancelled",
    note: "Your places have been released. Choose a time to try again.",
  },
  expired: {
    heading: "Payment window closed",
    note: "Your places have been released. Choose a time to try again.",
  },
  refunded: {
    heading: "Payment refunded",
    note: "Contact us with your booking reference if you have a question about the refund.",
  },
  review: {
    heading: "Payment needs a check",
    note: "Contact us with your booking reference before trying again.",
  },
};

type PaymentStatus = keyof typeof paymentMessages;

interface PaymentResult {
  status: PaymentStatus;
  reference: string;
  visit: {
    service: string;
    slot: string;
    date: string;
    time: string;
    guests: number;
    amount: number;
  };
}

export { paymentMessages };

export function readPaymentReturn(params: URLSearchParams) {
  const attempt = params.get("booking");
  const mode = params.get("checkout");
  if (
    !attempt ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
      attempt,
    ) ||
    (mode !== "return" && mode !== "cancel")
  )
    return;

  return { attempt, mode } as const;
}

export function stripeCheckoutUrl(value: unknown): URL | undefined {
  if (typeof value !== "string" || !URL.canParse(value)) return;
  const url = new URL(value);
  if (
    url.origin === "https://checkout.stripe.com" &&
    /^\/(?:[a-z]\/)?pay\/cs_(?:live|test)_[A-Za-z0-9]+\/?$/.test(url.pathname)
  ) {
    return url;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function checkPayment(
  api: string,
  attempt: string,
  cancel: boolean,
): Promise<PaymentResult | undefined> {
  const response = await fetch(api, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: cancel ? "cancel_checkout" : "payment_status",
      attempt,
    }),
    signal: AbortSignal.timeout(8_000),
  });
  if (response.status === 404) return;
  if (!response.ok) throw new Error("Could not check payment");

  const data: unknown = await response.json();
  if (!isRecord(data)) throw new Error("Invalid payment response");
  const { status, reference, visit } = data;
  if (
    typeof status !== "string" ||
    !isPaymentStatus(status) ||
    typeof reference !== "string" ||
    !isRecord(visit) ||
    (visit.service !== undefined && typeof visit.service !== "string") ||
    typeof visit.slot !== "string" ||
    typeof visit.date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(visit.date) ||
    typeof visit.time !== "string" ||
    !/^\d{2}:\d{2}$/.test(visit.time) ||
    typeof visit.guests !== "number" ||
    typeof visit.amount !== "number"
  )
    throw new Error("Invalid payment response");

  return {
    status,
    reference,
    visit: {
      service: visit.service ?? "communal",
      slot: visit.slot,
      date: visit.date,
      time: visit.time,
      guests: visit.guests,
      amount: visit.amount,
    },
  };
}

function isPaymentStatus(status: string): status is PaymentStatus {
  return Object.hasOwn(paymentMessages, status);
}
