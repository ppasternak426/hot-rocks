// Service choices come from the public booking selector. All numeric booking
// values and availability below are fixtures for the local demo.
type SessionGroup = "shared" | "guided" | "private";

interface DemoService {
  id: string;
  group: SessionGroup;
  name: string;
  minutes: number;
  samplePrice: number;
  billing: "person" | "group";
  minGuests: number;
  maxGuests: number;
  note?: string;
}

export const sessionGroups: { id: SessionGroup; label: string }[] = [
  { id: "shared", label: "Shared sauna" },
  { id: "guided", label: "Guided experiences" },
  { id: "private", label: "Private sauna and packages" },
];

export const demoServices: DemoService[] = [
  {
    id: "communal",
    group: "shared",
    name: "Communal Sauna",
    minutes: 60,
    samplePrice: 1400,
    billing: "person",
    minGuests: 1,
    maxGuests: 6,
  },
  {
    id: "slow",
    group: "shared",
    name: "Slow Sauna",
    minutes: 120,
    samplePrice: 2400,
    billing: "person",
    minGuests: 1,
    maxGuests: 6,
  },
  {
    id: "textile-free",
    group: "shared",
    name: "Textile-free Sauna",
    minutes: 60,
    samplePrice: 1400,
    billing: "person",
    minGuests: 1,
    maxGuests: 6,
  },
  {
    id: "slow-textile-free",
    group: "shared",
    name: "Textile-free Slow Sauna",
    minutes: 120,
    samplePrice: 2400,
    billing: "person",
    minGuests: 1,
    maxGuests: 6,
  },
  {
    id: "guided-ritual",
    group: "guided",
    name: "Guided Sauna Ritual",
    minutes: 180,
    samplePrice: 5000,
    billing: "person",
    minGuests: 1,
    maxGuests: 4,
  },
  {
    id: "pirts",
    group: "guided",
    name: "One-to-one Pirts with Andrea",
    minutes: 150,
    samplePrice: 13500,
    billing: "person",
    minGuests: 1,
    maxGuests: 1,
  },
  {
    id: "whisking",
    group: "guided",
    name: "Whisking It Up",
    minutes: 120,
    samplePrice: 5500,
    billing: "person",
    minGuests: 1,
    maxGuests: 4,
  },
  {
    id: "journey-steam",
    group: "guided",
    name: "Journey by Steam with Nick",
    minutes: 90,
    samplePrice: 3800,
    billing: "person",
    minGuests: 1,
    maxGuests: 4,
  },
  {
    id: "forest-view",
    group: "private",
    name: "Forest View Private Sauna",
    minutes: 60,
    samplePrice: 11500,
    billing: "group",
    minGuests: 1,
    maxGuests: 8,
  },
  {
    id: "lough-view",
    group: "private",
    name: "Lough View Private Sauna",
    minutes: 60,
    samplePrice: 21000,
    billing: "group",
    minGuests: 1,
    maxGuests: 15,
    note: "Available by request on the live site",
  },
  {
    id: "sauna-steak",
    group: "private",
    name: "Sauna & Steak for Two",
    minutes: 120,
    samplePrice: 7000,
    billing: "group",
    minGuests: 2,
    maxGuests: 2,
  },
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

export const demoTimes = [
  ["09:30", "11:00", "13:30", "16:00"],
  ["10:00", "12:30", "15:00"],
  [],
  ["10:30", "14:00", "17:00"],
];

export const demoCoupon = "DEMO10";

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
