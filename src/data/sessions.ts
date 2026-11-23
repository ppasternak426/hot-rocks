import { z } from "astro/zod";
import { sanityClient } from "sanity:client";

const bookingDemoSchema = z
  .object({
    group: z.enum(["shared", "guided", "private"]),
    minutes: z.number().int().positive(),
    samplePrice: z.number().int().nonnegative(),
    billing: z.enum(["person", "group"]),
    minGuests: z.number().int().positive(),
    maxGuests: z.number().int().positive(),
    note: z.string().optional(),
  })
  .refine(({ minGuests, maxGuests }) => maxGuests >= minGuests, {
    message: "Maximum guests must be at least the minimum guest count",
  });

export type DemoService = z.infer<typeof bookingDemoSchema> & {
  id: string;
  name: string;
};

const sessionSchema = z.object({
  _id: z.string(),
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().min(1),
  bookingDemo: bookingDemoSchema.nullable(),
  image: z.object({
    url: z.url(),
    alt: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
});

const catalogSchema = z.object({
  sessions: z.array(sessionSchema),
  selectedIds: z.array(z.string()),
});

const catalogQuery = `{
  "sessions": *[_type == "saunaSession"] | order(_createdAt asc, _id asc) {
    _id,
    "id": slug.current,
    "name": title,
    summary,
    description,
    bookingDemo,
    image {
      alt,
      "url": asset->url,
      "width": asset->metadata.dimensions.width,
      "height": asset->metadata.dimensions.height
    }
  },
  "selectedIds": coalesce(
    *[_id == "homepageSessions" && _type == "homepageSessions"][0].featuredSessions[0...3][]._ref,
    []
  )
}`;

export async function getSessionCatalog() {
  const data = await sanityClient.fetch<unknown>(
    catalogQuery,
    {},
    { perspective: "published" },
  );
  const { sessions, selectedIds } = catalogSchema.parse(data);
  const sessionsById = new Map(
    sessions.map((session) => [session._id, session]),
  );
  const featured = [...new Set(selectedIds)]
    .map((id) => sessionsById.get(id))
    .filter((session) => session !== undefined);

  return {
    featured,
    all: sessions,
  };
}
