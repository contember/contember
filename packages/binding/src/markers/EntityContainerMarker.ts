import { EntityFieldMarkers } from './EntityFieldMarkers'

export interface EntityContainerMarker {
	placeholderName: string
	hasAtLeastOneBearingField: boolean
	fields: EntityFieldMarkers
}
