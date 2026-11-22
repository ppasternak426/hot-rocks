import { z } from "astro/zod";
import { sanityClient } from "sanity:client";

const opinionsSchema = z.array(
  z.object({
    title: z.string().trim().nullable(),
    quote: z.string().trim().min(1),
    authorName: z.string().trim().nullable(),
    isSample: z.boolean(),
  }),
);

const featuredOpinionsQuery = `coalesce(
  *[_id == "homepageOpinions" && _type == "homepageOpinions"][0]
    .opinions[0...4]{
      title,
      quote,
      "authorName": coalesce(authorName, attribution),
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
