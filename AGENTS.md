# Agent instructions

## Project

Redesign https://thehotrockssauna.co.uk/ for mobile and desktop. This repository is an Astro + TypeScript + Bun + Tailwind CSS foundation; it is not yet the finished site. Read `docs/project-brief.md` before making product or content decisions.

## Working conventions

- Consult the user on meaningful design, architecture, tooling and product decisions. Do not treat proposals in the brief as approved designs or verified business facts.
- Use Bun and keep `bun.lock` in sync. Use Astro components and static rendering by default; add client JavaScript or a UI framework only when needed and agreed.
- Keep content separate from presentation so a CMS can be introduced later. Do not add a CMS until requested.
- Prioritize semantic HTML, keyboard access, visible focus, adequate contrast, reduced motion and responsive layouts. Verify UI on both mobile and desktop.
- Use real, authorized imagery and confirmed business information. Never invent testimonials, availability, prices or medical claims.
- Preserve and verify booking, payments, existing URLs and content before migration. Do not modify the live site, booking system, payments or DNS without explicit authorization.
- Run `bun run check` for code changes and perform relevant additional checks. Report limitations honestly.
- Before creating a PR, use the project code-review skill to critically review the complete change against the agreed requirements. Fix actionable findings and report remaining risks; never post reviews or create a PR without the user's authorization.

## Project skills

- `.agents/skills/frontend-design/SKILL.md`: design direction and implementation.
- `.agents/skills/web-design-guidelines/SKILL.md`: UI, accessibility and UX review; its instructions require fetching the current guidelines.
- `.agents/skills/code-review/SKILL.md`: critical review of changes, including before creating a PR.
- `.agents/skills/typescript-best-practices/SKILL.md`: TypeScript implementation and review; apply relevant advice with judgment for this Astro project.

Apply the relevant skill when the task calls for it. User instructions take precedence.
