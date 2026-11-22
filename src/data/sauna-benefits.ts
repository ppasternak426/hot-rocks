const sleepStudy = {
  label: "Hussain et al., Global Sauna Survey (2019)",
  href: "https://doi.org/10.1016/j.ctim.2019.03.012",
};
const bloodPressureStudy = {
  label: "Laukkanen et al., single-session study (2018)",
  href: "https://pubmed.ncbi.nlm.nih.gov/29269746/",
};
const bloodPressureTrial = {
  label: "Debray et al., eight-week randomised trial (2023)",
  href: "https://pubmed.ncbi.nlm.nih.gov/37650138/",
};
const strokeStudy = {
  label: "Kunutsor et al., Finnish stroke study (2018)",
  href: "https://doi.org/10.1212/WNL.0000000000005606",
};

export const benefitHighlights = [
  { icon: "moon", title: "Wind down for a better night’s sleep" },
  { icon: "pulse", title: "A brief dip in blood pressure" },
  { icon: "movement", title: "Warmth to soothe stiff joints" },
] as const;

export const saunaQuiz = [
  {
    kind: "choice",
    question: "How many sauna users said they slept better?",
    prompt:
      "Think of 10 people who answered the sleep question in a survey of sauna users.",
    options: ["About 4 in 10", "About 6 in 10", "About 8 in 10"],
    correct: "About 8 in 10",
    answer: "About 8 in 10",
    explanation:
      "353 of the 423 people who answered the sleep question reported slightly or much better sleep after sauna use. They volunteered for the survey and rated their own sleep, so it tells us how this group felt.",
    sources: [sleepStudy],
  },
  {
    kind: "range",
    question: "Where did the blood pressure reading land?",
    prompt:
      "The average top reading was 137 mmHg before a 30-minute study session. Guess the average immediately afterwards. A guess up to 2 mmHg above or below earns a point.",
    min: 120,
    max: 150,
    initial: 137,
    correct: 130,
    tolerance: 2,
    answer: "130 mmHg",
    explanation:
      "The top reading fell by 7 mmHg on average among 102 adults with at least one cardiovascular risk factor. That was an immediate change. In a separate eight-week trial of adults with stable coronary artery disease, researchers found no improvement in resting blood pressure.",
    sources: [bloodPressureStudy, bloodPressureTrial],
  },
  {
    kind: "choice",
    question: "How big was the difference in the stroke study?",
    prompt:
      "A Finnish study compared adults taking 4–7 saunas a week with adults going once a week. About how much lower was the estimated stroke rate in the more frequent group after researchers accounted for other risk factors?",
    options: ["About 20% lower", "About 40% lower", "About 60% lower"],
    correct: "About 60% lower",
    answer: "About 60% lower",
    explanation:
      "The adjusted relative estimate was 61% lower. The observed rates were 2.8 versus 8.1 strokes per 1,000 person-years. Researchers followed 1,628 adults for a median of nearly 15 years. They tracked existing habits, so the study could not show whether sauna use caused the difference.",
    sources: [strokeStudy],
  },
] as const;
