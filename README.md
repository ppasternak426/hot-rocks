# Hot Rocks Sauna

Foundation for a mobile-first redesign of [The Hot Rocks Sauna](https://thehotrockssauna.co.uk/). The site is not yet a finished redesign.

## Development

Install [Bun](https://bun.sh/) and run:

```sh
bun install
bun run dev
bun run check
bun run preview
```

The project uses Astro, strict TypeScript and Tailwind CSS. Use `bun install --frozen-lockfile` for reproducible installations. After installing dependencies, run `bun run prepare` to install the Lefthook Git hooks. The pre-push hook runs `bun run check`: formatting, ESLint, Astro type checking and a production build. Run `bun run format` to format project files.

## Project context

- [Agent instructions](AGENTS.md)
- [Project brief and open questions](docs/project-brief.md)
- [Project skills](.agents/skills/)

Content will initially live in the repository; a CMS may be added later. Booking and payment integration have not yet been implemented or verified.
