import * as React from 'react'
import { Environment } from '../dao'
import {
	ConnectionMarker,
	EntityFieldMarkers,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	SubTreeMarker,
} from '../markers'

export interface EnvironmentDeltaProvider<P extends {} = any> {
	generateEnvironment: (props: P, oldEnvironment: Environment) => Environment
}

/*
 * Components may also return EntityFields which serve as something of a Fragment on the Marker level.
 */

export interface FieldMarkerProvider<P extends {} = any> {
	// It may also return a HasOneRelationMarker so as to facilitate implementation of conditionally nested fields
	generateFieldMarker: (props: P, environment: Environment) => FieldMarker | HasOneRelationMarker | EntityFieldMarkers
}

export interface SubTreeMarkerProvider<P extends {} = any> {
	generateSubTreeMarker: (
		props: P,
		fields: EntityFieldMarkers,
		environment: Environment,
	) => SubTreeMarker | EntityFieldMarkers
}

export interface RelationMarkerProvider<P extends {} = any> {
	// It may also return a HasOneRelationMarker so as to facilitate implementation of conditionally nested connections
	generateRelationMarker: (
		props: P,
		fields: EntityFieldMarkers,
		environment: Environment,
	) => HasOneRelationMarker | HasManyRelationMarker | EntityFieldMarkers
}

export interface ConnectionMarkerProvider<P extends {} = any> {
	// It may also return a HasOneRelationMarker so as to facilitate implementation of conditionally nested connections
	generateConnectionMarker: (
		props: P,
		environment: Environment,
	) => ConnectionMarker | HasOneRelationMarker | EntityFieldMarkers
}

export interface SyntheticChildrenProvider<P extends {} = any> {
	generateSyntheticChildren: (props: P, environment: Environment) => React.ReactNode
}

export type CompleteMarkerProvider<P extends {} = any> = EnvironmentDeltaProvider<P> &
	FieldMarkerProvider<P> &
	SubTreeMarkerProvider<P> &
	RelationMarkerProvider<P> &
	ConnectionMarkerProvider<P> &
	SyntheticChildrenProvider<P>

export type MarkerProvider<P extends {} = any> = Partial<CompleteMarkerProvider<P>>
