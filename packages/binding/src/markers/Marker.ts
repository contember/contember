import { ConnectionMarker } from './ConnectionMarker'
import { FieldMarker } from './FieldMarker'
import { SubTreeMarker } from './SubTreeMarker'
import { ReferenceMarker } from './ReferenceMarker'

export type Marker = FieldMarker | ReferenceMarker | ConnectionMarker | SubTreeMarker
