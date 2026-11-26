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
- The current custom-domain Studio is hosted on Hostinger. Use the [maintenance guide](docs/maintenance.md) for its build and hosting configuration.
- Publishing content in Studio takes effect on the public site after the next Astro build and deployment. Once a site host is selected, connect its production deploy hook to a Sanity webhook for create, update and delete events in the `production` dataset. Filter out drafts and keep the deploy-hook URL in Sanity webhook settings.
- Verify the webhook on the deployed redesign by publishing an approved edit, checking that the host completes a fresh build, and confirming the resulting public content. A homepage featured selection should appear in precisely the order set in Studio.
- Serve Astro’s generated `404.html` with HTTP 404 for missing routes. Configure a permanent host redirect from `/about-us/` to `/sessions/` if supported. The static build also includes a redirect page.

### GitHub Pages preview

Build with `bun run build --site https://ppasternak426.github.io --base /hot-rocks` for the `/hot-rocks/` path. Publish the contents of `dist/` and an empty `.nojekyll` file to the root of the `gh-pages` branch. The preview is a snapshot of the published Sanity content at build time.

## Project context

- [Agent instructions](AGENTS.md)
- [Project brief and open questions](docs/project-brief.md)
- [Maintenance and integration context](docs/maintenance.md)
- [Project skills](.agents/skills/)

Editorial content lives in Sanity. The repository includes an Event Schedule booking preview and Stripe checkout integration; their deployed configuration and end-to-end behavior require verification. See the maintenance guide before making changes.
