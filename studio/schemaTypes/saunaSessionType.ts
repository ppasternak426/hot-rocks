import {defineField, defineType} from 'sanity'

export const saunaSessionType = defineType({
  name: 'saunaSession',
  title: 'Sauna session',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'slug',
      type: 'slug',
      description: 'Used in the link to this session. Keep it stable after publication.',
      options: {source: 'title'},
      validation: (rule) =>
        rule
          .required()
          .custom((slug) =>
            !slug?.current || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.current)
              ? true
              : 'Use lowercase letters, numbers and hyphens.',
          ),
    }),
    defineField({
      name: 'summary',
      title: 'Short description',
      description: 'A short blurb for the homepage card and session list.',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Full description',
      description: 'The full description shown on the individual session page.',
      type: 'text',
      rows: 4,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'bookingDemo',
      title: 'Booking demo settings',
      description: 'Add sample booking details to show this session in the booking demo.',
      type: 'object',
      fields: [
        defineField({
          name: 'group',
          title: 'Booking section',
          type: 'string',
          options: {
            list: [
              {title: 'Shared sauna', value: 'shared'},
              {title: 'Guided experiences', value: 'guided'},
              {title: 'Private sauna and packages', value: 'private'},
            ],
          },
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'minutes',
          title: 'Duration in minutes',
          type: 'number',
          validation: (rule) => rule.required().integer().min(1),
        }),
        defineField({
          name: 'samplePrice',
          title: 'Sample price in pence',
          type: 'number',
          validation: (rule) => rule.required().integer().min(0),
        }),
        defineField({
          name: 'billing',
          type: 'string',
          options: {
            list: [
              {title: 'Per person', value: 'person'},
              {title: 'Per group', value: 'group'},
            ],
          },
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'minGuests',
          title: 'Minimum guests',
          type: 'number',
          validation: (rule) => rule.required().integer().min(1),
        }),
        defineField({
          name: 'maxGuests',
          title: 'Maximum guests',
          type: 'number',
          validation: (rule) =>
            rule.required().integer().min(1).min(rule.valueOfField('minGuests')),
        }),
        defineField({name: 'note', title: 'Booking note', type: 'string'}),
      ],
    }),
    defineField({
      name: 'bookingUrl',
      title: 'Direct booking URL',
      description:
        'Use a live booking form configured for this session. Leave blank to use the general booking form.',
      type: 'url',
      validation: (rule) => rule.uri({scheme: ['https']}),
    }),
    defineField({
      name: 'image',
      type: 'image',
      validation: (rule) => rule.required().assetRequired(),
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative text',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
      ],
    }),
  ],
})
