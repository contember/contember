import type { PlaceholderName } from '../treeParameters'
import type { FieldMarker } from './FieldMarker'
import type { HasManyRelationMarker } from './HasManyRelationMarker'
import type { HasOneRelationMarker } from './HasOneRelationMarker'

export type EntityFieldMarker = FieldMarker | HasOneRelationMarker | HasManyRelationMarker
export type EntityFieldMarkers = Map<PlaceholderName, EntityFieldMarker>
