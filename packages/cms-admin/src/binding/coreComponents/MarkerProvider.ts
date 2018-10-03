import * as React from 'react'
import FieldMarker from '../dao/FieldMarker'
import MarkerTreeRoot from '../dao/MarkerTreeRoot'
import ReferenceMarker from '../dao/ReferenceMarker'

export interface DataBindingComponent {
	displayName: string
}

export interface FieldMarkerProvider extends DataBindingComponent {
	generateFieldMarker: (props: any) => FieldMarker
}

export interface MarkerTreeRootProvider extends DataBindingComponent {
	generateMarkerTreeRoot: (props: any, fields: MarkerTreeRoot['fields']) => MarkerTreeRoot
}

export interface ReferenceMarkerProvider extends DataBindingComponent {
	generateReferenceMarker: (props: any, fields: ReferenceMarker['fields']) => ReferenceMarker
}

export interface SyntheticChildrenProvider extends DataBindingComponent {
	generateSyntheticChildren: (props: any) => React.ReactNode
}

type MarkerProvider = Partial<
	| FieldMarkerProvider
	| MarkerTreeRootProvider
	| ReferenceMarkerProvider
	| SyntheticChildrenProvider
> &
	DataBindingComponent

export default MarkerProvider
