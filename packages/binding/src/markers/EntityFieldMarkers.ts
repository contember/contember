import { PlaceholderName } from '../treeParameters'
import { FieldMarker } from './FieldMarker'
import { HasManyRelationMarker } from './HasManyRelationMarker'
import { HasOneRelationMarker } from './HasOneRelationMarker'

export type EntityFieldMarker = FieldMarker | HasOneRelationMarker | HasManyRelationMarker
export type EntityFieldMarkers = Map<PlaceholderName, EntityFieldMarker>
