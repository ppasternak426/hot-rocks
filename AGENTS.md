# Agent instructions

## Project

Redesign https://thehotrockssauna.co.uk/ for mobile and desktop. This repository is an Astro + TypeScript + Bun + Tailwind CSS foundation; it is not yet the finished site. Read `docs/project-brief.md` before making product or content decisions.

Read `docs/maintenance.md` for the current integration and deployment context. Update it when the setup or maintenance procedures change, and label unverified details.

## Working conventions

- Consult the user on meaningful design, architecture, tooling and product decisions. Do not treat proposals in the brief as approved designs or verified business facts.
- Use Bun and keep `bun.lock` in sync. Use Astro components and static rendering by default; add client JavaScript or a UI framework only when needed and agreed.
- Keep content separate from presentation. The project uses Sanity; consult the user before introducing another CMS or making meaningful architecture changes.
- Prioritize semantic HTML, keyboard access, visible focus, adequate contrast, reduced motion and responsive layouts. Verify UI on both mobile and desktop.
- For UI and UX work, apply the project `frontend-design` skill's principles throughout. Use `impeccable` for defining or refining the brief and reviewing the result; keep the user's agreed direction and project requirements authoritative if guidance overlaps or conflicts. Consult the user on meaningful visual choices before implementing them.
- Use real, authorized imagery and confirmed business information. Never invent testimonials, availability, prices or medical claims.
- Preserve and verify booking, payments, existing URLs and content before migration. Do not modify the live site, booking system, payments or DNS without explicit authorization.
- Run `bun run check` for code changes and perform relevant additional checks. Report limitations honestly.
- Before creating a PR, use the project code-review skill to critically review the complete change against the agreed requirements. Fix actionable findings and report remaining risks; never post reviews or create a PR without the user's authorization.

## Project skills

- `.agents/skills/astro/SKILL.md`: Astro components, pages, configuration and content; check the official documentation for current APIs and use the project's Bun commands.
- `.agents/skills/frontend-design/SKILL.md`: design direction and implementation.
- `.agents/skills/impeccable/SKILL.md`: clarify visual and product direction, plan UI/UX work, and evaluate or refine the result alongside `frontend-design`.
- `.agents/skills/web-design-guidelines/SKILL.md`: UI, accessibility and UX review; its instructions require fetching the current guidelines.
- `.agents/skills/code-review/SKILL.md`: critical review of changes, including before creating a PR.
- `.agents/skills/typescript-best-practices/SKILL.md`: TypeScript implementation and review; apply relevant advice with judgment for this Astro project.

Apply the relevant skill when the task calls for it. User instructions take precedence.
