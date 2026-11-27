# Maintenance and integration context

This guide records the redesign setup for future maintainers and agents, including checks from 26–27 November 2026. Update it when integrations, access requirements or deployment procedures change. Date new verification and keep secret values and personal booking data out of the repository.

## System overview

- The root project is an Astro static site using Bun, TypeScript and Tailwind. `studio/` is a separate Sanity Studio with its own dependencies and lockfile.
- Sanity stores editorial content. The website build reads published content; a content change needs a fresh site build and deployment to appear in a static preview.
- The repository contains a booking preview in `integrations/event-schedule/`. Its PHP code connects availability and reservations to Event Schedule and includes Stripe checkout. Sanity sessions are mapped to booking inventory. The seed and configuration identify preview schedules and test data. Code in the repository alone does not establish the current deployed behavior or payment mode.
- GitHub holds the source and a manually dispatched workflow builds and deploys a Hostinger preview. GitHub Pages has a separate documented build and publishing process.

## Environments and resources

| Resource                                                                     | Purpose and status                                                                                                                                                      |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [thehotrockssauna.co.uk](https://thehotrockssauna.co.uk/)                    | Original live site. Preserve its existing booking, payments, URLs and content; do not alter it or DNS without explicit authorization.                                   |
| [Astro preview](https://preview.thehotrockssauna.co.uk/)                     | Current Hostinger deployment target. GitHub Actions verified the deployed homepage and `noindex` on 26 November 2026.                                                   |
| [Sanity Studio](https://sanity.thehotrockssauna.co.uk/)                      | Studio built from `studio/`, hosted on Hostinger and verified in Chrome against the existing Sanity dataset on 26 November 2026.                                        |
| [Event Schedule](https://schedule.thehotrockssauna.co.uk/)                   | Dedicated Hostinger site and new database. This instance starts with no events and is separate from the Astro preview booking backend.                                  |
| `aquatic-paleturquoise-albatross-43.hostingersite.com/hot-rocks-booking.php` | Existing test booking API. Both preview origins returned availability, and a Stripe sandbox checkout was created and cancelled from the new origin on 26 November 2026. |
| [GitHub Pages preview](https://ppasternak426.github.io/hot-rocks/)           | Separate static preview; current deployed version unverified.                                                                                                           |
| [GitHub repository](https://github.com/ppasternak426/hot-rocks)              | Preview rollout commit `abcee91` was deployed by [GitHub Actions](https://github.com/ppasternak426/hot-rocks/actions/runs/45899886922).                                 |
| [Sanity project](https://www.sanity.io/manage/project/mdwbejwr)              | Project `mdwbejwr`, public dataset `production`. Both Studio addresses use this dataset.                                                                                |

The earlier Astro hostname `tender-palegoldenrod-porcupine-90.hostingersite.com` and Studio hostname `sunny-mediumvioletred-turkey-87.hostingersite.com` are retained during verification. Hostinger serves the DNS zone and Names.co.uk is the registrar. The hPanel DNS editor works for this external domain even when the connector DNS endpoint denies access.

The connector returned 404 when creating the custom preview site. The signed-in hPanel successfully provisioned all three domains through **Websites → Create site → PHP/HTML website → use existing domain → Start empty**. Hostinger added the corresponding DNS records and issued certificates. Verify public DNS and HTTPS after provisioning. The three new sites send `X-Robots-Tag: noindex`, and Studio and Schedule rely on their own sign-in for editor and admin access.

## Sanity

Run the Studio locally and check its build using the commands in the [README](../README.md). Schema and Studio changes are separate from website deployment. The README documents a Studio deploy command, but verify the intended Studio and access before using it. Publishing Sanity content changes the published dataset; it does not itself prove that a static website has rebuilt. A deploy webhook is described as a future setup in the README; its existence has not been verified.

Build the Hostinger Studio with `bun run build --no-auto-updates` in `studio/` to bundle the locked Studio version. Keep the web root’s single-page fallback to `index.html` and `X-Robots-Tag: noindex`. The Sanity CORS list allows authenticated requests from `https://sanity.thehotrockssauna.co.uk`.

The first auto-updating build served HTML but rendered blank in Chrome. The bundled build loaded the existing project content. For a redeploy, package `studio/dist/` with `index.html` and the hosting rules at the archive root, then verify that `/structure` opens and renders the document list while signed in. An HTTP 200 from the Studio shell alone misses this failure.

## Event Schedule and Stripe

The implementation lives in `integrations/event-schedule/`: configuration and preview schedule identifiers are in `config.php`, availability and public booking handling in `public.php`, and checkout handling in `checkout.php`. `seed.php` creates or updates preview data and must not be run casually against an unknown installation. The configured timezone is `Europe/London`.

The test adapter on `aquatic-…` uses older inventory lookup code than `main`. The subdomain rollout applied only the origin and checkout return changes to the deployed files. It allows the two exact Astro preview origins and stores the initiating origin with the checkout attempt. Inspect the deployed version before replacing it. Coordinate future Sanity mapping changes because both backends read the same dataset.

On the test site, `public_html/hot-rocks-booking.php` loads PHP helpers from the sibling `hot-rocks-booking/` directory. The helpers load the sibling Event Schedule installation and call its Laravel models and controllers, so check compatibility with the installed app version before an upgrade. In the repository version, Sanity `bookingSource` uses event or appointment slugs while `bookingDemo` still supplies guest limits. Some inventory queries also scope results to hard-coded preview schedules. Check those settings before mapping the new inventory, and keep `seed.php` for the demo backend.

Keep the new Schedule inventory empty until the site owner approves events, capacity, prices and rules. Configure the booking adapter for that instance and verify availability, checkout, cancellations, webhooks and email before routing preview or production bookings there. The preview Stripe integration only accepts sandbox payments.

The new Schedule site has Event Schedule `v1.0.149` and a dedicated database. On 26 November 2026 the initial admin completed setup. The signed-in dashboard loaded, public sign-up redirected to login, and the health endpoint returned HTTP 200. The Hostinger layout keeps the Laravel application and `.env` in `event-schedule/` beside `public_html/`. The public entry point and Laravel public path are adjusted for that layout. Preserve the split when upgrading and verify it before using the built-in updater.

The Hostinger cron entry runs `/bin/bash` on `schedule-cron.sh` in the Schedule site directory every minute. The script changes into `event-schedule/` and runs `artisan schedule:run --no-ansi` with Hostinger's PHP 8.3 CLI. The previous inline command registered no heartbeat. After replacing it, Hostinger reported completed tasks and the [admin Queue](https://schedule.thehotrockssauna.co.uk/admin/queue) showed a recent cron tick and all tasks healthy. Check both views after a PHP or deployment change.

For a rebuild of Event Schedule on this hosting plan, keep the release files outside the web root and publish only the release’s `public/` contents in `public_html/`. Adjust the public entry point’s paths for `.env`, maintenance mode, Composer and Laravel bootstrap. Set Laravel’s public path to `public_html/` so the setup wizard and CLI use the same asset directory. During rollout, site-scoped File Manager uploaded the archive but returned HTTP 403 on extraction. A temporary Hostinger cron job running a private extraction script succeeded and was removed after verification.

## GitHub and deployment

The default branch is `main`. Run `bun run check` for code changes; follow the additional checks and conventions in [AGENTS.md](../AGENTS.md). The GitHub connector reported push access to the repository on 26 November 2026; individual maintainers must have their own appropriate access.

The workflow `.github/workflows/deploy-hostinger-preview.yml` runs by manual dispatch on `main`. It installs dependencies, builds with published Sanity content, deploys the generated static files to the configured Hostinger preview and checks the homepage and `noindex` header. It expects `HOSTINGER_API_TOKEN` in the GitHub Actions `hostinger-preview` environment. The existing secret worked for the 26 November 2026 rollout. Confirm the target and authorization before running it; monitor the workflow and verify the resulting site. Do not disclose the token.

`PUBLIC_BOOKING_API_URL` is public Astro build configuration. Switching the preview backend requires a rebuild and a matching origin allowlist in PHP. The rollout verified availability from both allowed origins, rejection of an unrelated origin, and one sandbox checkout created and cancelled from the new address. A completed payment and webhook delivery were outside that check.

On the rollout laptop, Codex’s bundled Node runtime could not load the installed macOS native build dependencies. Using a checksum-verified official Node.js runtime on `PATH` let the frozen Bun installs build both projects without lockfile edits.

For the separate GitHub Pages build and branch publishing instructions, see the [README](../README.md). Neither workflow should be assumed to update the original live site.

## Access and open checks

Maintenance may require GitHub repository and Actions access, Sanity project and dataset access, Hostinger account access to the correct site, and authorized Event Schedule and Stripe access. Store credentials in their approved secret managers, not in this guide. Do not assume access to one service grants access to another.

Prefer the Hostinger connector for inspecting and managing the hosting account when it is available. Use the project’s existing deployment workflow where appropriate, and confirm the target and required authorization before making changes.

On 26 November 2026, all three custom subdomains were provisioned on Hostinger Business. Confirm the current settings through the Hostinger connector or the signed-in hPanel. Outstanding integration work includes approved Schedule inventory, Sanity mapping changes, outgoing booking email and production Stripe configuration.

## Change checklist

1. Identify the affected environment, owner and integration; confirm the target before making a change.
2. Check this guide and the project brief, inspect current state, and obtain the explicit authorization required for live site, booking, payment or DNS changes.
3. Run checks appropriate to the change, including `bun run check` for code changes. Use a safe, agreed test environment for booking and payment verification.
4. For an authorized deployment, check the build and deployment result and verify the intended site and behavior. Record limitations and any checks not performed.
5. Update this guide and any linked instructions when configuration, access, procedures or verified status changes. Keep secrets and customer data out of documentation.
