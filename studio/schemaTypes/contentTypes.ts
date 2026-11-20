import {defineArrayMember, defineField, defineType} from 'sanity'

const heading = () =>
  defineField({name: 'heading', type: 'string', validation: (r) => r.required()})
const intro = () => defineField({name: 'intro', type: 'text', validation: (r) => r.required()})
const photo = () =>
  defineField({
    name: 'photo',
    type: 'image',
    validation: (r) => r.required().assetRequired(),
    fields: [
      defineField({
        name: 'alt',
        title: 'Alternative text',
        type: 'string',
        validation: (r) => r.required(),
      }),
    ],
  })

export const contentTypes = [
  defineType({
    name: 'firstVisit',
    title: 'First Visit',
    type: 'document',
    fields: [
      heading(),
      intro(),
      defineField({
        name: 'questions',
        type: 'array',
        of: [
          defineArrayMember({
            type: 'object',
            fields: [
              defineField({name: 'question', type: 'string', validation: (r) => r.required()}),
              defineField({name: 'answer', type: 'text', validation: (r) => r.required()}),
            ],
            preview: {select: {title: 'question'}},
          }),
        ],
        validation: (r) => r.required().min(1),
      }),
    ],
  }),
  defineType({
    name: 'visitSettings',
    title: 'Visit and contact',
    type: 'document',
    fields: [
      intro(),
      defineField({name: 'locationHeading', type: 'string', validation: (r) => r.required()}),
      defineField({name: 'locationNote', type: 'string', validation: (r) => r.required()}),
      defineField({name: 'contactNote', type: 'text', validation: (r) => r.required()}),
      defineField({
        name: 'postalAddress',
        type: 'object',
        fields: [
          defineField({name: 'streetAddress', type: 'string', validation: (r) => r.required()}),
          defineField({name: 'addressLocality', type: 'string', validation: (r) => r.required()}),
          defineField({name: 'postalTown', type: 'string', validation: (r) => r.required()}),
          defineField({name: 'addressRegion', type: 'string', validation: (r) => r.required()}),
          defineField({name: 'postalCode', type: 'string', validation: (r) => r.required()}),
          defineField({
            name: 'addressCountry',
            description: 'Two-letter country code, such as GB.',
            type: 'string',
            validation: (r) => r.required().regex(/^[A-Z]{2}$/),
          }),
        ],
        validation: (r) => r.required(),
      }),
      defineField({
        name: 'directionsUrl',
        type: 'url',
        validation: (r) => r.required().uri({scheme: ['https']}),
      }),
      defineField({name: 'contactEmail', type: 'email', validation: (r) => r.required()}),
      defineField({name: 'phoneDisplay', type: 'string', validation: (r) => r.required()}),
      defineField({
        name: 'phoneInternational',
        type: 'string',
        validation: (r) => r.required().regex(/^\+[1-9]\d{7,14}$/),
      }),
      ...(['facebook', 'instagram', 'tiktok'] as const).map((name) =>
        defineField({name, type: 'url', validation: (r) => r.required().uri({scheme: ['https']})}),
      ),
    ],
  }),
  defineType({
    name: 'photoGallery',
    title: 'Gallery',
    type: 'document',
    fields: [
      heading(),
      intro(),
      defineField({
        name: 'photos',
        description: 'Drag to reorder. The first photo spans the gallery.',
        type: 'array',
        of: [
          defineArrayMember({
            type: 'image',
            validation: (r) => r.assetRequired(),
            fields: [
              defineField({
                name: 'alt',
                title: 'Alternative text',
                type: 'string',
                validation: (r) => r.required(),
              }),
            ],
            preview: {select: {title: 'alt', media: 'asset'}},
          }),
        ],
        validation: (r) => r.required().min(1),
      }),
    ],
  }),
  defineType({
    name: 'homeContent',
    title: 'Homepage copy',
    type: 'document',
    fields: [
      heading(),
      intro(),
      photo(),
      defineField({name: 'sessionsHeading', type: 'string', validation: (r) => r.required()}),
      defineField({name: 'sessionsIntro', type: 'text', validation: (r) => r.required()}),
      defineField({name: 'hostsHeading', type: 'string', validation: (r) => r.required()}),
      defineField({name: 'hostsIntro', type: 'text', validation: (r) => r.required()}),
      defineField({
        name: 'hostsPhoto',
        type: 'image',
        validation: (r) => r.required().assetRequired(),
        fields: [
          defineField({
            name: 'alt',
            title: 'Alternative text',
            type: 'string',
            validation: (r) => r.required(),
          }),
        ],
      }),
    ],
  }),
  defineType({
    name: 'aboutContent',
    title: 'About',
    type: 'document',
    fields: [
      heading(),
      photo(),
      defineField({
        name: 'story',
        title: 'Bio paragraphs',
        type: 'array',
        of: [defineArrayMember({type: 'text'})],
        validation: (r) => r.required().min(1),
      }),
    ],
  }),
]
