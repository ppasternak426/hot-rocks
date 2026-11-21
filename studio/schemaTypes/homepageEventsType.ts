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
        'Choose up to three published events and drag to set their order on the homepage. Selected events stay featured after their date until you remove them here.',
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
