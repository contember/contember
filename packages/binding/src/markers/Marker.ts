import { ConnectionMarker } from './ConnectionMarker'
import { FieldMarker } from './FieldMarker'
import { MarkerSubTree } from './MarkerSubTree'
import { ReferenceMarker } from './ReferenceMarker'

export type Marker = FieldMarker | ReferenceMarker | ConnectionMarker | MarkerSubTree
