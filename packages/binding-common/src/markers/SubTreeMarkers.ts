import type { PlaceholderName } from '../treeParameters/index.js'
import type { EntityListSubTreeMarker } from './EntityListSubTreeMarker.js'
import type { EntitySubTreeMarker } from './EntitySubTreeMarker.js'

export type SubTreeMarkers = ReadonlyMap<PlaceholderName, EntitySubTreeMarker | EntityListSubTreeMarker>
