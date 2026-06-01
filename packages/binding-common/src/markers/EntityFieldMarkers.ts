import type { PlaceholderName } from '../treeParameters/index.js'
import type { FieldMarker } from './FieldMarker.js'
import type { HasManyRelationMarker } from './HasManyRelationMarker.js'
import type { HasOneRelationMarker } from './HasOneRelationMarker.js'

export type EntityFieldMarker = FieldMarker | HasOneRelationMarker | HasManyRelationMarker
export type EntityFieldMarkers = ReadonlyMap<PlaceholderName, EntityFieldMarker>
