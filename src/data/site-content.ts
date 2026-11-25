import { z } from "astro/zod";
import { sanityClient } from "sanity:client";

const text = z.string().trim().min(1);
const httpsUrl = z.url().refine((url) => url.startsWith("https://"));
const photoSchema = z.object({
  alt: text,
  url: httpsUrl,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export type SitePhoto = z.infer<typeof photoSchema>;

const assetFields = `
  "url": asset->url,
  "width": asset->metadata.dimensions.width,
  "height": asset->metadata.dimensions.height
`;
const photoFields = `alt, ${assetFields}`;
const photoProjection = `{ ${photoFields} }`;
const backgroundPhotoProjection = `{ "alt": "", ${assetFields} }`;
const backgroundPhotoSchema = photoSchema
  .extend({ alt: z.literal("") })
  .nullish();

const saunaBenefitsSchema = z.object({
  intro: text,
  heading: text,
  topics: z
    .array(
      z.object({
        title: text,
        body: text,
        sources: z.array(z.object({ label: text, href: httpsUrl })).min(1),
      }),
    )
    .min(1),
});

const firstVisitSchema = z.object({
  heading: text,
  intro: text,
  questions: z.array(z.object({ question: text, answer: text })).min(1),
});

const visitSchema = z.object({
  intro: text,
  locationHeading: text,
  locationNote: text,
  arrivalNotes: text.nullish(),
  contactNote: text,
  postalAddress: z.object({
    streetAddress: text,
    addressLocality: text,
    postalTown: text,
    addressRegion: text,
    postalCode: text,
    addressCountry: z.string().regex(/^[A-Z]{2}$/),
  }),
  directionsUrl: httpsUrl,
  contactEmail: z.email(),
  phoneDisplay: text,
  phoneInternational: z.string().regex(/^\+[1-9]\d{7,14}$/),
  facebook: httpsUrl,
  instagram: httpsUrl,
  tiktok: httpsUrl,
});

const homeSchema = z.object({
  heading: text,
  intro: text,
  photo: photoSchema,
  sessionsHeading: text,
  sessionsIntro: text,
  benefitsBackground: backgroundPhotoSchema,
  visitBackground: backgroundPhotoSchema,
  hostsHeading: text,
  hostsIntro: text,
  hostsPhoto: photoSchema,
});

const aboutSchema = z.object({
  heading: text,
  photo: photoSchema,
  story: z.array(text).min(1),
});

const gallerySchema = z.object({
  heading: text,
  intro: text,
  photos: z.array(photoSchema.extend({ caption: text.nullish() })).min(1),
});

async function fetchContent(id: string, projection: string) {
  const data = await sanityClient.fetch<unknown>(
    `*[_id == $id && _type == $id][0]${projection}`,
    { id },
    { perspective: "published" },
  );

  if (data === null) {
    throw new Error(`Missing published Sanity document: ${id}`);
  }

  return data;
}

export async function getSaunaBenefitsContent() {
  return saunaBenefitsSchema.parse(await fetchContent("saunaBenefits", ""));
}

export async function getFirstVisitContent() {
  return firstVisitSchema.parse(await fetchContent("firstVisit", ""));
}

export async function getVisitSettings() {
  const settings = visitSchema.parse(await fetchContent("visitSettings", ""));
  const { postalTown, ...postalAddress } = settings.postalAddress;

  return {
    ...settings,
    contactUrl: `mailto:${settings.contactEmail}`,
    contactPhoneUrl: `tel:${settings.phoneInternational}`,
    postalAddress,
    address: [
      postalAddress.streetAddress,
      postalAddress.addressLocality,
      `${postalTown} ${postalAddress.postalCode}`,
    ].join(", "),
    socialProfiles: [
      { label: "Facebook", href: settings.facebook },
      { label: "Instagram", href: settings.instagram },
      { label: "TikTok", href: settings.tiktok },
    ] as const,
  };
}

async function fetchHomeContent() {
  return homeSchema.parse(
    await fetchContent(
      "homeContent",
      `{ heading, intro, photo ${photoProjection}, sessionsHeading, sessionsIntro,
      hostsHeading, hostsIntro, hostsPhoto ${photoProjection},
      benefitsBackground.asset-> != null => { benefitsBackground ${backgroundPhotoProjection} },
      visitBackground.asset-> != null => { visitBackground ${backgroundPhotoProjection} } }`,
    ),
  );
}

let publishedHomeContent: ReturnType<typeof fetchHomeContent> | undefined;

export function getHomeContent() {
  return import.meta.env.PROD
    ? (publishedHomeContent ??= fetchHomeContent())
    : fetchHomeContent();
}

export async function getAboutContent() {
  return aboutSchema.parse(
    await fetchContent(
      "aboutContent",
      `{ heading, photo ${photoProjection}, story }`,
    ),
  );
}

export async function getGalleryContent() {
  return gallerySchema.parse(
    await fetchContent(
      "photoGallery",
      `{ heading, intro, photos[] { caption, ${photoFields} } }`,
    ),
  );
}
