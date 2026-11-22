import { z } from "astro/zod";
import { sanityClient } from "sanity:client";

const eventSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  startsAt: z.iso.datetime({ offset: true }),
  image: z
    .object({
      url: z.url(),
      alt: z.string().trim().min(1),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    })
    .nullable(),
});

export type SaunaEvent = z.infer<typeof eventSchema>;

const eventProjection = `{
  "slug": slug.current,
  title,
  description,
  startsAt,
  "image": select(defined(image.asset) => image {
    alt,
    "url": asset->url,
    "width": asset->metadata.dimensions.width,
    "height": asset->metadata.dimensions.height
  })
}`;

const eventsQuery = `*[_type == "event"] | order(dateTime(startsAt) asc) ${eventProjection}`;
const featuredEventsQuery = `coalesce(
  *[_id == "homepageEvents" && _type == "homepageEvents"][0]
    .featuredEvents[0...3][]->${eventProjection},
  []
)`;

const eventDateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/London",
});

const compactEventDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/London",
});

const eventTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeStyle: "short",
  timeZone: "Europe/London",
});

export function formatCompactEventDate(startsAt: string) {
  const date = new Date(startsAt);
  return {
    day: compactEventDateFormatter.format(date),
    time: eventTimeFormatter.format(date),
  };
}

export function formatEventDate(startsAt: string): string {
  return eventDateFormatter.format(new Date(startsAt));
}

export async function getPublishedEvents(): Promise<SaunaEvent[]> {
  const events = await sanityClient.fetch<unknown>(
    eventsQuery,
    {},
    {
      perspective: "published",
    },
  );
  return z.array(eventSchema).parse(events);
}

export async function getFeaturedEvents(): Promise<SaunaEvent[]> {
  const selection = await sanityClient.fetch<unknown>(
    featuredEventsQuery,
    {},
    { perspective: "published" },
  );
  const events = z.array(eventSchema.nullable()).parse(selection);
  return events.filter((event) => event !== null);
}
