import {defineArrayMember, defineField, defineType} from 'sanity'

export const homepageEventsType = defineType({
  name: 'homepageEvents',
  title: 'Homepage events',
  type: 'document',
  fields: [
    defineField({
      name: 'featuredEvents',
      title: 'Featured events',
      description:
        'Choose up to three events and drag to set their order. The first event leads the homepage section. Only published, upcoming events appear on the site.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'event'}],
          weak: true,
          options: {disableNew: true},
        }),
      ],
      validation: (rule) => rule.max(3).unique(),
    }),
  ],
})
