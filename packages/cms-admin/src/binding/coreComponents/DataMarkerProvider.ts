import EntityMarker, { EntityFields } from '../dao/EntityMarker'
import FieldMarker from '../dao/FieldMarker'
import ReferenceMarker from '../dao/ReferenceMarker'

export interface EntityMarkerProvider {
	generateEntityMarker: (props: any, childrenFields: EntityFields) => EntityMarker
}

export interface FieldMarkerProvider {
	generateFieldMarker: (props: any) => FieldMarker
}

export interface MultipleFieldMarkerProvider {
	generateFieldMarkers: (props: any) => FieldMarker[]
}

export interface ReferenceMarkerProvider {
	generateReferenceMarker: (props: any, referredEntity: EntityMarker) => ReferenceMarker
}

type DataMarkerProvider = Partial<
	EntityMarkerProvider | FieldMarkerProvider | MultipleFieldMarkerProvider | ReferenceMarkerProvider
>

export default DataMarkerProvider
