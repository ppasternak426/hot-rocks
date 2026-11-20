import {defineArrayMember, defineField, defineType} from 'sanity'

export const homepageSessionsType = defineType({
  name: 'homepageSessions',
  title: 'Homepage sessions',
  type: 'document',
  fields: [
    defineField({
      name: 'featuredSessions',
      title: 'Featured sessions',
      description:
        'Choose up to three published sessions and drag to reorder them. The first session gets the large card on the homepage. All published sessions appear on the Sessions page.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'saunaSession'}],
          weak: true,
          options: {disableNew: true},
        }),
      ],
      validation: (rule) => rule.max(3).unique(),
    }),
  ],
})
