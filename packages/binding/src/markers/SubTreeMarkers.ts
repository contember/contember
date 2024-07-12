import type { PlaceholderName } from '../treeParameters'
import type { EntityListSubTreeMarker } from './EntityListSubTreeMarker'
import type { EntitySubTreeMarker } from './EntitySubTreeMarker'

export type SubTreeMarkers = Map<PlaceholderName, EntitySubTreeMarker | EntityListSubTreeMarker>
