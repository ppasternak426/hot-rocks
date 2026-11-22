export const sessionCategories = [
  { id: "shared", label: "Shared sauna" },
  { id: "guided", label: "Guided rituals" },
  { id: "private", label: "Private hire & packages" },
  { id: "other", label: "Other sessions" },
] as const;

type SessionComparison = {
  category: Exclude<(typeof sessionCategories)[number]["id"], "other">;
  displayName?: string;
  comparisonSummary?: string;
  duration?: string;
  format: string;
};

export const sessionComparison: Partial<Record<string, SessionComparison>> = {
  communal: {
    category: "shared",
    displayName: "Communal sauna",
    duration: "1 hour",
    format: "Communal",
    comparisonSummary:
      "Warm up by the lough and take cold plunge breaks at your own pace.",
  },
  "slow-sauna": {
    category: "shared",
    displayName: "Slow Sauna",
    duration: "2 hours",
    format: "Communal",
    comparisonSummary: "Take more time to cool off and unwind between rounds.",
  },
  "textile-free-sauna": {
    displayName: "Textile-free sauna",
    comparisonSummary:
      "A shared session without swimwear, open to all genders.",
    category: "shared",
    duration: "1 hour",
    format: "Communal, textile-free",
  },
  "slow-sauna-textile-free": {
    displayName: "Textile-free Slow Sauna",
    comparisonSummary:
      "Take more time to relax between rounds in the textile-free sauna.",
    category: "shared",
    duration: "2 hours",
    format: "Communal, textile-free",
  },
  rituals: {
    category: "guided",
    displayName: "Sauna master’s ritual",
    duration: "3 hours",
    format: "Guided group",
    comparisonSummary:
      "Join Andrea and Jacek for scented steam, leaf whisking and cold plunge breaks.",
  },
  "traditional-pirts": {
    category: "guided",
    displayName: "Traditional Pirts with Andrea",
    format: "One-to-one",
  },
  "whisking-it-up": {
    displayName: "Whisking it up",
    category: "guided",
    duration: "2 hours",
    format: "Guided whisking",
  },
  "journey-by-steam-with-nick": {
    category: "guided",
    format: "Guided by Nick",
  },
  private: {
    displayName: "Forest View private sauna",
    comparisonSummary: "Have the Forest View sauna to yourselves.",
    category: "private",
    duration: "1 hour",
    format: "Private, up to 8 guests",
  },
  "private-sauna-lough-view": {
    displayName: "Lough View private sauna",
    comparisonSummary:
      "Reserve the sauna overlooking the lough for your group.",
    category: "private",
    duration: "1 hour",
    format: "Private, up to 15 guests",
  },
  "sauna-and-steak-for-two": {
    displayName: "Sauna & steak for two",
    comparisonSummary:
      "After the sauna, head to The Gate Inn for steak and a bottle of house wine.",
    category: "private",
    duration: "1-hour sauna",
    format: "Shared sauna and dinner for two",
  },
};

export const onRequestSessionId = "private-sauna-lough-view";
