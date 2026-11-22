import { saunaQuiz } from "../data/sauna-benefits";

const resultMessages = [
  "Thanks for giving it a go. Follow your curiosity and explore the benefits, from winding down in the warmth to taking a breather by the lough.",
  "Nice work. You’ve already picked up something about sauna, and there’s always another little detail to take away.",
  "Lovely work. That was a good mix of familiar ground and things worth getting curious about.",
  "You nailed it. Thanks for following your curiosity all the way through. A well-earned moment to sit back and unwind.",
];

class HotRocksQuiz extends HTMLElement {
  connectedCallback(): void {
    const rounds = [...this.querySelectorAll<HTMLElement>("[data-round]")];
    const result = this.querySelector<HTMLElement>("[data-result]");
    const scoreDisplay = this.querySelector("[data-score]");
    const resultFeedback = result?.querySelector("[data-result-feedback]");
    const readingLink = result?.querySelector<HTMLElement>(
      "[data-result-reading]",
    );
    if (!result || !scoreDisplay || !resultFeedback || !readingLink) return;

    let score = 0;

    this.querySelector("[data-restart]")?.addEventListener("click", () => {
      score = 0;
      result.hidden = true;
      for (const [index, round] of rounds.entries()) {
        round.hidden = index !== 0;
        const form = round.querySelector("form");
        const reveal = round.querySelector<HTMLElement>("[data-reveal]");
        if (form && reveal) {
          form.reset();
          form
            .querySelector("input[type='range']")
            ?.dispatchEvent(new Event("input"));
          form.hidden = false;
          reveal.hidden = true;
        }
      }
      rounds[0]?.querySelector("h3")?.focus();
    });

    for (const [index, panel] of rounds.entries()) {
      const round = saunaQuiz[index];
      const form = panel.querySelector("form");
      const reveal = panel.querySelector<HTMLElement>("[data-reveal]");
      const feedback = panel.querySelector("[data-feedback]");
      if (!round || !form || !reveal || !feedback) continue;

      if (round.kind === "range") this.setupSlider(form);

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (form.hidden) return;
        const guesses = new FormData(form);

        switch (round.kind) {
          case "choice": {
            const guess = guesses.get("guess");
            const correct = guess === round.correct;
            if (correct) score++;
            feedback.textContent = `${correct ? "Nicely guessed!" : "Thanks for giving it a go."} You picked ${String(guess).toLowerCase()}.`;
            break;
          }
          case "range": {
            const guess = Number(guesses.get("guess"));
            const correct = Math.abs(guess - round.correct) <= round.tolerance;
            if (correct) score++;
            feedback.textContent = correct
              ? `Nicely guessed! Your ${guess} mmHg was within the range.`
              : `Thanks for taking a guess. You went with ${guess} mmHg.`;
            break;
          }
        }

        form.hidden = true;
        reveal.hidden = false;
        reveal.querySelector("h3")?.focus();
      });

      reveal.querySelector("[data-next]")?.addEventListener("click", () => {
        panel.hidden = true;
        const nextRound = rounds[index + 1];
        if (nextRound) {
          nextRound.hidden = false;
          nextRound.querySelector("h3")?.focus();
          return;
        }

        scoreDisplay.textContent = String(score);
        resultFeedback.textContent = resultMessages[score];
        readingLink.hidden = score !== 0;
        result.hidden = false;
        result.querySelector("h3")?.focus();
      });
    }
  }

  private setupSlider(form: HTMLFormElement): void {
    const input = form.querySelector<HTMLInputElement>("input[type='range']");
    const display = form.querySelector("[data-pressure]");
    if (!input || !display) return;

    const update = () => {
      input.setAttribute(
        "aria-valuetext",
        `${input.value} millimetres of mercury`,
      );
      display.textContent = input.value;
    };
    const decrease = form.querySelector("[data-decrease]");
    const increase = form.querySelector("[data-increase]");

    input.addEventListener("input", update);
    decrease?.addEventListener("click", () => {
      input.stepDown();
      update();
    });
    increase?.addEventListener("click", () => {
      input.stepUp();
      update();
    });
    update();
  }
}

customElements.define("hot-rocks-quiz", HotRocksQuiz);
