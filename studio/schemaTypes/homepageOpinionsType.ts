import {defineArrayMember, defineField, defineType} from 'sanity'

export const homepageOpinionsType = defineType({
  name: 'homepageOpinions',
  title: 'Homepage opinions',
  type: 'document',
  fields: [
    defineField({
      name: 'opinions',
      title: 'Featured opinions',
      description: 'Add up to five guest quotes and drag to set their order on the homepage.',
      type: 'array',
      validation: (rule) => rule.max(5),
      of: [
        defineArrayMember({
          name: 'guestOpinion',
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              title: 'Opinion title',
              description: 'Sum up the experience in one to three words.',
              type: 'string',
              validation: (rule) =>
                rule.required().custom((value) => {
                  if (typeof value !== 'string') return true
                  const words = value.trim().split(/\s+/).filter(Boolean)
                  return (words.length >= 1 && words.length <= 3) || 'Use one to three words.'
                }),
            }),
            defineField({
              name: 'quote',
              type: 'text',
              rows: 3,
              description: 'Use the guest’s own words with permission to publish.',
              validation: (rule) => rule.required().max(350),
            }),
            defineField({
              name: 'authorName',
              title: 'Author name',
              description: 'Optional. Use the name the guest has agreed to share.',
              type: 'string',
              validation: (rule) => rule.max(80),
            }),
            defineField({
              name: 'rating',
              title: 'Star rating',
              type: 'number',
              description: 'Optional. Use the rating from the original review.',
              validation: (rule) => rule.integer().min(1).max(5),
            }),
            defineField({
              name: 'isSample',
              title: 'Sample quote',
              description: 'Turn on for placeholder copy so it is labelled on the homepage.',
              type: 'boolean',
              initialValue: false,
            }),
          ],
          preview: {select: {title: 'title', subtitle: 'authorName'}},
        }),
      ],
    }),
  ],
})
