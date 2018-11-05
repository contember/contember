import * as React from 'react'
import { Environment, FieldMarker, MarkerTreeRoot, ReferenceMarker } from '../dao'

export interface DataBindingComponent {
	displayName: string
}

export interface EnvironmentDeltaProvider extends DataBindingComponent {
	generateEnvironmentDelta: (props: any, oldEnvironment: Environment) => Partial<Environment.NameStore>
}

export interface FieldMarkerProvider extends DataBindingComponent {
	generateFieldMarker: (props: any, environment: Environment) => FieldMarker
}

export interface MarkerTreeRootProvider extends DataBindingComponent {
	generateMarkerTreeRoot: (props: any, fields: MarkerTreeRoot['fields'], environment: Environment) => MarkerTreeRoot
}

export interface ReferenceMarkerProvider extends DataBindingComponent {
	generateReferenceMarker: (
		props: any,
		fields: ReferenceMarker.Reference['fields'],
		environment: Environment
	) => ReferenceMarker
}

export interface SyntheticChildrenProvider extends DataBindingComponent {
	generateSyntheticChildren: (props: any, environment: Environment) => React.ReactNode
}

export type MarkerProvider = Partial<
	| EnvironmentDeltaProvider
	| FieldMarkerProvider
	| MarkerTreeRootProvider
	| ReferenceMarkerProvider
	| SyntheticChildrenProvider
> &
	DataBindingComponent
