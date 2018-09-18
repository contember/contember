import * as React from 'react'
import EntityMarker, { EntityFields } from '../dao/EntityMarker'
import FieldMarker from '../dao/FieldMarker'
import MarkerTreeRoot from '../dao/MarkerTreeRoot'
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

export interface MarkerTreeRootProvider extends DataBindingComponent {
	generateMarkerTreeRoot: (props: any, treeRoot: MarkerTreeRoot['root']) => MarkerTreeRoot
}

export interface MultipleFieldMarkerProvider extends DataBindingComponent {
	generateFieldMarkers: (props: any) => FieldMarker[]
}

export interface ReferenceMarkerProvider extends DataBindingComponent {
	generateReferenceMarker: (props: any, referredEntity: ReferenceMarker['reference']) => ReferenceMarker
}

export interface SyntheticChildrenProvider extends DataBindingComponent {
	generateSyntheticChildren: (props: any) => React.ReactNode
}

type DataMarkerProvider = Partial<
	| EntityMarkerProvider
	| FieldMarkerProvider
	| MarkerTreeRootProvider
	| MultipleFieldMarkerProvider
	| ReferenceMarkerProvider
	| SyntheticChildrenProvider
> &
	DataBindingComponent

export default DataMarkerProvider
