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

## Sanity Studio

The website lives at the repository root. The standalone editor lives in [studio/](studio/) and has its own dependencies and lockfile. Both apps use the existing Sanity project `mdwbejwr` and its `production` dataset.

From the repository root, install and start the editor:

```sh
cd studio
bun install --frozen-lockfile
bun run dev --port 3333
```

Open [Sanity Studio](http://localhost:3333/) and sign in with a Sanity account that has access to the project. Run `bun run build` from `studio/` to check the editor build.

### Deployment

- Build the website from the repository root with `bun run build` and publish the root `dist/` directory.
- To publish the editor to Sanity hosting, run `bun run deploy` from `studio/` while signed in. This deploys the Studio and its schema separately from Astro.
- Publishing content in Studio takes effect on the public site after the next Astro build. A Sanity webhook can trigger that build through the site host.

## Project context

- [Agent instructions](AGENTS.md)
- [Project brief and open questions](docs/project-brief.md)
- [Project skills](.agents/skills/)

Editorial content lives in Sanity. Booking and payment integration have not yet been implemented or verified.
