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
    name: 'saunaBenefits',
    title: 'Sauna benefits',
    type: 'document',
    fields: [
      intro(),
      heading(),
      defineField({
        name: 'topics',
        type: 'array',
        validation: (r) => r.required().min(1),
        of: [
          defineArrayMember({
            type: 'object',
            fields: [
              defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
              defineField({name: 'body', type: 'text', rows: 4, validation: (r) => r.required()}),
              defineField({
                name: 'sources',
                title: 'Supporting studies',
                type: 'array',
                validation: (r) => r.required().min(1),
                of: [
                  defineArrayMember({
                    type: 'object',
                    fields: [
                      defineField({name: 'label', type: 'string', validation: (r) => r.required()}),
                      defineField({
                        name: 'href',
                        title: 'Study URL',
                        type: 'url',
                        validation: (r) => r.required().uri({scheme: ['https']}),
                      }),
                    ],
                    preview: {select: {title: 'label'}},
                  }),
                ],
              }),
            ],
            preview: {select: {title: 'title'}},
          }),
        ],
      }),
    ],
  }),
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
      defineField({
        name: 'arrivalNotes',
        title: 'Arrival and access',
        description: 'Confirmed details about parking, the entrance, changing facilities and step-free access.',
        type: 'text',
        rows: 4,
      }),
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
                name: 'caption',
                title: 'Visible caption',
                description: 'Help visitors recognise the setting or facilities shown in this photo.',
                type: 'string',
                validation: (r) => r.custom((value) =>
                  value === undefined || value.trim() ? true : 'Enter a caption or leave it blank.',
                ),
              }),
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
      {...photo(), title: 'Hero photo', options: {hotspot: true}},
      defineField({name: 'sessionsHeading', type: 'string', validation: (r) => r.required()}),
      defineField({name: 'sessionsIntro', type: 'text', validation: (r) => r.required()}),
      defineField({
        name: 'benefitsBackground',
        title: 'Sauna benefits background',
        type: 'image',
        validation: (r) => r.assetRequired(),
      }),
      defineField({
        name: 'visitBackground',
        title: 'Plan your visit background',
        type: 'image',
        validation: (r) => r.assetRequired(),
      }),
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
