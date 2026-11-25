type SessionGroup = "shared" | "guided" | "private";

export const sessionGroups: { id: SessionGroup; label: string }[] = [
  { id: "shared", label: "Shared sauna" },
  { id: "guided", label: "Guided experiences" },
  { id: "private", label: "Private sauna and packages" },
];

export const bookingSteps = [
  { id: "session", label: "Session" },
  { id: "time", label: "Date & time" },
  { id: "details", label: "Guest details" },
  { id: "review", label: "Review" },
] as const;

export const demoGuest = {
  name: "Sam Taylor",
  email: "sam@example.com",
  phone: "07700 900123",
};

const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

export function formatSamplePrice(pence: number) {
  return currency.format(pence / 100);
}

export function formatSampleDuration(minutes: number) {
  return minutes % 60 === 0
    ? `${minutes / 60} hr`
    : `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
}
