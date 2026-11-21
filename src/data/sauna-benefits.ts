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
  {
    icon: "moon",
    title: "Better sleep",
    summary:
      "Sauna users in a survey reported sleeping better after a session.",
  },
  {
    icon: "pulse",
    title: "Blood pressure",
    summary:
      "One study measured a short-term drop after a single sauna session.",
  },
  {
    icon: "movement",
    title: "Less stiffness",
    summary:
      "People with arthritis reported short-term relief in a small infrared sauna study.",
  },
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
      "The average top reading was 137 mmHg before a 30-minute study session. Guess the average immediately afterwards. Within 2 mmHg earns a point.",
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

export const benefitTopics = [
  {
    title: "Sleep and winding down",
    paragraphs: [
      "Sauna users often talk about how they feel later that evening. Researchers have asked them about sleep quality, relaxation and how long any effects seem to last. These answers describe their experience. A controlled study with objective sleep measurements would answer a different question.",
      "The sleep research here leaves open whether the same experience is likely for a first-time visitor or for someone with insomnia.",
    ],
    sources: [sleepStudy],
  },
  {
    title: "Blood pressure and cardiovascular health",
    paragraphs: [
      "A reading taken just after stepping out of the heat captures a short-term response. Resting blood pressure measured weeks later tells us whether anything has changed beyond the session. Both questions matter, and the results can differ.",
      "Long-term studies have also compared cardiovascular outcomes across people with different sauna habits. Those groups can differ in other ways, such as how active they are. Researchers can account for some of those differences, while others may still influence the results.",
    ],
    sources: [bloodPressureStudy, bloodPressureTrial, strokeStudy],
  },
  {
    title: "Colds and respiratory health",
    paragraphs: [
      "A small controlled study counted how often volunteers caught colds. A separate Finnish study followed men over time to see who developed pneumonia. Counting new illnesses tells us little about whether sauna relieves symptoms for someone who is already ill.",
    ],
    sources: [
      {
        label: "Ernst et al., common-cold study (1990)",
        href: "https://doi.org/10.3109/07853899009148930",
      },
      {
        label: "Kunutsor et al., pneumonia cohort (2017)",
        href: "https://pubmed.ncbi.nlm.nih.gov/29229091/",
      },
    ],
  },
  {
    title: "Pain and stiffness",
    paragraphs: [
      "A small pilot study asked people with rheumatoid arthritis or ankylosing spondylitis to rate pain and stiffness around infrared sauna sessions. It reported some short-term relief. That study used a different kind of heat from a wood-fired sauna, and a change during a session leaves the question of lasting relief open.",
    ],
    sources: [
      {
        label: "Oosterveld et al., infrared sauna pilot (2009)",
        href: "https://pubmed.ncbi.nlm.nih.gov/18685882/",
      },
    ],
  },
  {
    title: "Dementia and long-term sauna habits",
    paragraphs: [
      "Two Finnish studies followed people with different sauna habits and compared later dementia diagnoses. One enrolled middle-aged men, while the other included men and women across a broader age range. They also compared different frequencies and reported different-sized associations.",
      "Both studies tracked habits people had already chosen. Whether sauna use played a causal role in the difference remains an open question.",
    ],
    sources: [
      {
        label: "Laukkanen et al., Kuopio cohort (2017)",
        href: "https://academic.oup.com/ageing/article/46/2/245/2654230",
      },
      {
        label: "Knekt et al., Finnish Mobile Clinic cohort (2020)",
        href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7560162/",
      },
    ],
  },
] as const;
