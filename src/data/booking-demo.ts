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
    name: "Communal session 1 hour",
    minutes: 60,
    samplePrice: 1400,
    billing: "person",
    minGuests: 1,
    maxGuests: 6,
  },
  {
    id: "slow-sauna",
    group: "shared",
    name: "Slow Sauna (2 hours)",
    minutes: 120,
    samplePrice: 2400,
    billing: "person",
    minGuests: 1,
    maxGuests: 6,
  },
  {
    id: "textile-free-sauna",
    group: "shared",
    name: "Textile Free session 1 hour",
    minutes: 60,
    samplePrice: 1400,
    billing: "person",
    minGuests: 1,
    maxGuests: 6,
  },
  {
    id: "slow-sauna-textile-free",
    group: "shared",
    name: "Slow Sauna Textile Free (2 hours)",
    minutes: 120,
    samplePrice: 2400,
    billing: "person",
    minGuests: 1,
    maxGuests: 6,
  },
  {
    id: "rituals",
    group: "guided",
    name: "Sauna ritual guided by a sauna master (3 hours)",
    minutes: 180,
    samplePrice: 5000,
    billing: "person",
    minGuests: 1,
    maxGuests: 4,
  },
  {
    id: "traditional-pirts",
    group: "guided",
    name: "Traditional Pirts 1 to 1 Experience with Andrea (2.5 hours)",
    minutes: 150,
    samplePrice: 13500,
    billing: "person",
    minGuests: 1,
    maxGuests: 1,
  },
  {
    id: "whisking-it-up",
    group: "guided",
    name: "Whisking it up - a traditional sauna 2 hours experience",
    minutes: 120,
    samplePrice: 5500,
    billing: "person",
    minGuests: 1,
    maxGuests: 4,
  },
  {
    id: "journey-by-steam-with-nick",
    group: "guided",
    name: "Journey by steam with Nick",
    minutes: 90,
    samplePrice: 3800,
    billing: "person",
    minGuests: 1,
    maxGuests: 4,
  },
  {
    id: "private",
    group: "private",
    name: "Private Sauna for 1 hour max 8 people (Forest View)",
    minutes: 60,
    samplePrice: 11500,
    billing: "group",
    minGuests: 1,
    maxGuests: 8,
  },
  {
    id: "private-sauna-lough-view",
    group: "private",
    name: "Private Sauna for 1 hour max 15 people (Lough View) on request",
    minutes: 60,
    samplePrice: 21000,
    billing: "group",
    minGuests: 1,
    maxGuests: 15,
    note: "Available by request on the live site",
  },
  {
    id: "sauna-and-steak-for-two",
    group: "private",
    name: "Sauna&Steak For Two",
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
