import { FieldMarker } from './FieldMarker'
import { HasManyRelationMarker } from './HasManyRelationMarker'
import { HasOneRelationMarker } from './HasOneRelationMarker'
import { SubTreeMarker } from './SubTreeMarker'

export type Marker = FieldMarker | HasOneRelationMarker | HasManyRelationMarker | SubTreeMarker
