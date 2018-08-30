import EntityMarker, { EntityFields } from '../dao/EntityMarker'
import FieldMarker from '../dao/FieldMarker'
import ReferenceMarker from '../dao/ReferenceMarker'

export interface DataBindingComponent {
	displayName: string
}

export interface EntityMarkerProvider extends DataBindingComponent {
	generateEntityMarker: (props: any, childrenFields: EntityFields) => EntityMarker
}

export interface FieldMarkerProvider extends DataBindingComponent {
	generateFieldMarker: (props: any) => FieldMarker
}

export interface MultipleFieldMarkerProvider extends DataBindingComponent {
	generateFieldMarkers: (props: any) => FieldMarker[]
}

export interface ReferenceMarkerProvider extends DataBindingComponent {
	generateReferenceMarker: (props: any, referredEntity: EntityMarker) => ReferenceMarker
}

type DataMarkerProvider = Partial<
	EntityMarkerProvider | FieldMarkerProvider | MultipleFieldMarkerProvider | ReferenceMarkerProvider
> & DataBindingComponent

export default DataMarkerProvider
