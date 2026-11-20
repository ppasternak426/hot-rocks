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
        rule.required().custom((slug) =>
          !slug?.current || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.current)
            ? true
            : 'Use lowercase letters, numbers and hyphens.',
        ),
    }),
    defineField({name: 'summary', type: 'text', rows: 2, validation: (rule) => rule.required()}),
    defineField({name: 'description', type: 'text', rows: 4, validation: (rule) => rule.required()}),
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
