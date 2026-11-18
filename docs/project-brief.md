# Project brief

## Goal

Refresh The Hot Rocks Sauna website while keeping its distinctive identity and making the offering, booking and practical visit information easy to use on phones and desktops. The business describes a wood-fired sauna and guided rituals by Lough Neagh in Northern Ireland.

## Agreed foundation

- Astro, TypeScript, Bun and Tailwind CSS; no React initially.
- Store site content in the repository initially. Introduce an owner-friendly CMS later when requested; keep content separate from UI.
- Preserve booking, payment, location and map functionality in the finished site. The existing booking system is the source of availability; do not build a replacement by assumption.
- Use a mobile-first, accessible approach and verify both mobile and desktop.
- Discuss meaningful decisions with the user before implementing them.

## Proposed information architecture — to validate

Home; Sessions; Events; First Visit / FAQ; About; Visit & Contact; Book Now. Consider separate event pages and direct links to individual booking services if supported. Existing URLs and anchors need an inventory and a redirect plan before launch.

## Content and integration questions

- Confirm the installed booking plugin and its version, add-ons, data ownership and integration options. Bookly was mentioned in an earlier discussion but has not been verified in the WordPress admin.
- Confirm the Stripe configuration, existing bookings, vouchers, coupons, confirmations and cancellation flow before deciding how to integrate.
- Confirm prices, descriptions, capacity, session duration, location, opening times and visit rules with the owners. At review time the Forest View private session was shown at £155 on the offer page and £125 in the booking selector; neither price should be assumed correct.
- Verify health-related statements with appropriate sources and the owners. Do not repeat unverified medical claims.
- Confirm rights to use photographs, logo, reviews and other existing assets.
- Determine the owner's CMS editing needs, provider, hosting, privacy and costs before implementation.

## Review and launch

Test keyboard navigation, focus, contrast, reduced motion and responsive layouts; measure performance and SEO rather than assuming a framework guarantees either. Test the complete booking journey in a safe test environment, including payment and confirmation, without creating real bookings. Plan redirects and validate the map and contact links before launch.
