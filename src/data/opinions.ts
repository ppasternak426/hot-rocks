import { z } from "astro/zod";
import { sanityClient } from "sanity:client";

const opinionsSchema = z.array(
  z.object({
    title: z.string().trim().nullable(),
    quote: z.string().trim().min(1),
    authorName: z.string().trim().nullable(),
    rating: z.number().int().min(1).max(5).nullable(),
    isSample: z.boolean(),
  }),
);

const featuredOpinionsQuery = `coalesce(
  *[_id == "homepageOpinions" && _type == "homepageOpinions"][0]
    .opinions[0...5]{
      title,
      quote,
      "authorName": coalesce(authorName, attribution),
      rating,
      "isSample": coalesce(isSample, false)
    },
  []
)`;

export async function getFeaturedOpinions() {
  const opinions = await sanityClient.fetch<unknown>(
    featuredOpinionsQuery,
    {},
    { perspective: "published" },
  );
  return opinionsSchema.parse(opinions);
}
