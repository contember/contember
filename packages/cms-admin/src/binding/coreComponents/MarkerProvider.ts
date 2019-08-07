import * as React from 'react'
import { ConnectionMarker, Environment, FieldMarker, MarkerTreeRoot, ReferenceMarker } from '../dao'

export interface NamedComponent {
	displayName: string
}

export interface EnvironmentDeltaProvider<P extends {} = any> {
	generateEnvironmentDelta: (props: P, oldEnvironment: Environment) => Partial<Environment.NameStore>
}

export interface FieldMarkerProvider<P extends {} = any> {
	generateFieldMarker: (props: P, environment: Environment) => FieldMarker
}

export interface MarkerTreeRootProvider<P extends {} = any> {
	generateMarkerTreeRoot: (props: P, fields: MarkerTreeRoot['fields'], environment: Environment) => MarkerTreeRoot
}

export interface ReferenceMarkerProvider<P extends {} = any> {
	generateReferenceMarker: (
		props: P,
		fields: ReferenceMarker.Reference['fields'],
		environment: Environment,
	) => ReferenceMarker
}

export interface ConnectionMarkerProvider<P extends {} = any> {
	generateConnectionMarker: (props: P, environment: Environment) => ConnectionMarker
}

export interface SyntheticChildrenProvider<P extends {} = any> {
	generateSyntheticChildren: (props: P, environment: Environment) => React.ReactNode
}

export type CompleteMarkerProvider<P extends {} = any> = EnvironmentDeltaProvider<P> &
	FieldMarkerProvider<P> &
	MarkerTreeRootProvider<P> &
	ReferenceMarkerProvider<P> &
	ConnectionMarkerProvider<P> &
	SyntheticChildrenProvider<P>

export type MarkerProvider<P extends {} = any> = Partial<CompleteMarkerProvider<P>>
