import { PlaceholderName } from '../treeParameters'
import { EntityListSubTreeMarker } from './EntityListSubTreeMarker'
import { EntitySubTreeMarker } from './EntitySubTreeMarker'

export type SubTreeMarkers = Map<PlaceholderName, EntitySubTreeMarker | EntityListSubTreeMarker>
