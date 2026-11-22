import {defineConfig, defineSingleton} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Hot rocks',

  projectId: 'mdwbejwr',
  dataset: 'production',

  plugins: [structureTool(), visionTool()],

  document: {
    singletons: [
      defineSingleton({
        documentId: 'homepageOpinions',
        schemaType: 'homepageOpinions',
        title: 'Homepage opinions',
      }),
      defineSingleton({
        documentId: 'homepageEvents',
        schemaType: 'homepageEvents',
        title: 'Homepage events',
      }),
      defineSingleton({
        documentId: 'homepageSessions',
        schemaType: 'homepageSessions',
        title: 'Homepage sessions',
      }),
      defineSingleton({
        documentId: 'saunaBenefits',
        schemaType: 'saunaBenefits',
        title: 'Sauna benefits',
      }),
      defineSingleton({documentId: 'firstVisit', schemaType: 'firstVisit', title: 'First Visit'}),
      defineSingleton({
        documentId: 'visitSettings',
        schemaType: 'visitSettings',
        title: 'Visit and contact',
      }),
      defineSingleton({documentId: 'photoGallery', schemaType: 'photoGallery', title: 'Gallery'}),
      defineSingleton({
        documentId: 'homeContent',
        schemaType: 'homeContent',
        title: 'Homepage copy',
      }),
      defineSingleton({documentId: 'aboutContent', schemaType: 'aboutContent', title: 'About'}),
    ],
  },

  schema: {
    types: schemaTypes,
  },
})
