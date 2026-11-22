import {contentTypes} from './contentTypes'
import {eventType} from './eventType'
import {homepageEventsType} from './homepageEventsType'
import {homepageOpinionsType} from './homepageOpinionsType'
import {saunaSessionType} from './saunaSessionType'
import {homepageSessionsType} from './homepageSessionsType'

export const schemaTypes = [
  eventType,
  homepageEventsType,
  saunaSessionType,
  homepageSessionsType,
  homepageOpinionsType,
  ...contentTypes,
]
