import * as React from 'react'
import { Environment } from '../dao'
import { ConnectionMarker, EntityFieldMarkers, FieldMarker, MarkerSubTree, ReferenceMarker } from '../markers'

export interface EnvironmentDeltaProvider<P extends {} = any> {
	generateEnvironment: (props: P, oldEnvironment: Environment) => Environment
}

/*
 * Components may also return EntityFields which serve as something of a Fragment on the Marker level.
 */

export interface FieldMarkerProvider<P extends {} = any> {
	// It may also return a ReferenceMarker so as to facilitate implementation of conditionally nested fields
	generateFieldMarker: (props: P, environment: Environment) => FieldMarker | ReferenceMarker | EntityFieldMarkers
}

export interface MarkerSubTreeProvider<P extends {} = any> {
	generateMarkerSubTree: (
		props: P,
		fields: MarkerSubTree['fields'],
		environment: Environment,
	) => MarkerSubTree | EntityFieldMarkers
}

export interface ReferenceMarkerProvider<P extends {} = any> {
	generateReferenceMarker: (
		props: P,
		fields: ReferenceMarker.Reference['fields'],
		environment: Environment,
	) => ReferenceMarker | EntityFieldMarkers
}

export interface ConnectionMarkerProvider<P extends {} = any> {
	// It may also return a ReferenceMarker so as to facilitate implementation of conditionally nested connections
	generateConnectionMarker: (
		props: P,
		environment: Environment,
	) => ConnectionMarker | ReferenceMarker | EntityFieldMarkers
}

export interface SyntheticChildrenProvider<P extends {} = any> {
	generateSyntheticChildren: (props: P, environment: Environment) => React.ReactNode
}

export type CompleteMarkerProvider<P extends {} = any> = EnvironmentDeltaProvider<P> &
	FieldMarkerProvider<P> &
	MarkerSubTreeProvider<P> &
	ReferenceMarkerProvider<P> &
	ConnectionMarkerProvider<P> &
	SyntheticChildrenProvider<P>

export type MarkerProvider<P extends {} = any> = Partial<CompleteMarkerProvider<P>>
