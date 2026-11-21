import { saunaQuiz } from "../data/sauna-benefits";

class HotRocksQuiz extends HTMLElement {
  connectedCallback(): void {
    const rounds = [...this.querySelectorAll<HTMLElement>("[data-round]")];
    const result = this.querySelector<HTMLElement>("[data-result]");
    const scoreDisplay = this.querySelector("[data-score]");
    const distanceDisplay = this.querySelector("[data-distance]");
    const share = this.querySelector<HTMLButtonElement>("[data-share]");
    const shareStatus = this.querySelector("[data-share-status]");
    const fallback = this.querySelector<HTMLElement>("[data-link-fallback]");
    const fallbackInput = fallback?.querySelector("input");

    if (
      !result ||
      !scoreDisplay ||
      !distanceDisplay ||
      !share ||
      !shareStatus ||
      !fallback ||
      !fallbackInput
    ) {
      return;
    }

    let score = 0;
    let pressureDistance = 0;
    const quizUrl = new URL("/benefits/#sauna-quiz", location.origin).href;
    share.hidden = typeof navigator.share !== "function";

    const copyLink = async (): Promise<void> => {
      try {
        await navigator.clipboard.writeText(quizUrl);
        fallback.hidden = true;
        shareStatus.textContent = "Challenge link copied.";
      } catch {
        shareStatus.textContent = "";
        fallback.hidden = false;
        fallbackInput.value = quizUrl;
        fallbackInput.focus();
        fallbackInput.select();
      }
    };

    this.querySelector("[data-copy]")?.addEventListener("click", () => {
      void copyLink();
    });

    share.addEventListener("click", async () => {
      try {
        await navigator.share({
          title: "The Hot Rocks Sauna Quiz",
          text: `I got ${score} out of ${saunaQuiz.length}. How close can you get?`,
          url: quizUrl,
        });
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          await copyLink();
        }
      }
    });

    this.querySelector("[data-restart]")?.addEventListener("click", () => {
      score = 0;
      pressureDistance = 0;
      result.hidden = true;
      shareStatus.textContent = "";
      fallback.hidden = true;
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
            if (guess === round.correct) score++;
            feedback.textContent = `Your guess was ${String(guess).toLowerCase()}.`;
            break;
          }
          case "range": {
            const guess = Number(guesses.get("guess"));
            pressureDistance = Math.abs(guess - round.correct);
            if (pressureDistance <= round.tolerance) score++;
            feedback.textContent = `Your guess was ${guess} mmHg.`;
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
        distanceDisplay.textContent =
          pressureDistance === 0
            ? "You guessed the blood pressure reading exactly."
            : `Your blood pressure guess was ${pressureDistance} mmHg away from the study result.`;
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
