import {defineArrayMember, defineField, defineType} from 'sanity'

const sourceSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

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
      name: 'bookingSource',
      title: 'Booking source',
      description: 'Link this session to inventory in Event Schedule.',
      type: 'object',
      fields: [
        defineField({
          name: 'kind',
          title: 'Booking type',
          type: 'string',
          options: {
            list: [
              {title: 'Event tickets', value: 'tickets'},
              {title: 'Private appointment', value: 'appointment'},
              {title: 'By request', value: 'request'},
            ],
          },
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'eventSlugs',
          title: 'Event slugs',
          description:
            'Copy the event slug from the URL. It comes after the shared Hot Rocks schedule name and before any event ID or date. Use one paid GBP ticket type, set unpaid tickets to expire after one hour, and add each recurring series once.',
          type: 'array',
          of: [defineArrayMember({type: 'string', validation: (rule) => rule.regex(sourceSlug)})],
          hidden: ({parent}) => parent?.kind !== 'tickets',
          validation: (rule) => rule.unique().max(24),
        }),
        defineField({
          name: 'addonName',
          title: 'Required add-on',
          description:
            'For a package, enter the exact add-on name from Event Schedule. One add-on is reserved per booking.',
          type: 'string',
          hidden: ({parent}) => parent?.kind !== 'tickets',
          validation: (rule) => rule.max(120),
        }),
        defineField({
          name: 'appointmentSlug',
          title: 'Appointment type slug',
          description:
            'Copy the last part of the appointment type’s public booking URL from the private Hot Rocks schedule. Use a paid GBP appointment with capacity one and no required extra questions or approval.',
          type: 'string',
          hidden: ({parent}) => parent?.kind !== 'appointment',
          validation: (rule) => rule.regex(sourceSlug),
        }),
      ],
      validation: (rule) =>
        rule.custom((source, {document}) => {
          if (!source || source.kind === 'request') return true
          if (!document?.bookingDemo) return 'Complete the booking details for this session.'
          if (
            source.kind === 'tickets' &&
            (!Array.isArray(source.eventSlugs) || !source.eventSlugs.length)
          )
            return 'Add at least one event slug.'
          if (source.kind === 'appointment' && !source.appointmentSlug)
            return 'Enter the appointment type slug.'
          return true
        }),
    }),
    defineField({
      name: 'bookingDemo',
      title: 'Booking details',
      description:
        'Set the category and guest limits. For linked sessions, Event Schedule supplies the checkout price.',
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
          title: 'Legacy price in pence',
          hidden: ({document}) => Boolean(document?.bookingSource),
          type: 'number',
          validation: (rule) => rule.integer().min(0),
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
