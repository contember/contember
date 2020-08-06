import * as React from 'react'
import { Environment } from '../dao'
import {
	EntityFieldMarkersContainer,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	SubTreeMarker,
} from '../markers'

export interface EnvironmentDeltaProvider<Props extends {} = any> {
	generateEnvironment: (props: Props, oldEnvironment: Environment) => Environment
}

/*
 * Components may also return EntityFields which serve as something of a Fragment on the Marker level.
 */

export interface FieldMarkerProvider<Props extends {} = any> {
	// It may also return a HasOneRelationMarker so as to facilitate implementation of conditionally nested fields
	generateFieldMarker: (
		props: Props,
		environment: Environment,
	) => FieldMarker | HasOneRelationMarker | EntityFieldMarkersContainer
}

export interface SubTreeMarkerProvider<Props extends {} = any> {
	generateSubTreeMarker: (
		props: Props,
		fields: EntityFieldMarkersContainer,
		environment: Environment,
	) => SubTreeMarker | EntityFieldMarkersContainer
}

export interface RelationMarkerProvider<Props extends {} = any> {
	// It may also return a HasOneRelationMarker so as to facilitate implementation of conditionally nested connections
	generateRelationMarker: (
		props: Props,
		fields: EntityFieldMarkersContainer,
		environment: Environment,
	) => HasOneRelationMarker | HasManyRelationMarker | EntityFieldMarkersContainer
}

// See https://github.com/microsoft/TypeScript/issues/23182#issuecomment-379091887 about the never trick
// This is just to make the typings less confusing and verbose downstream.
export type StaticRenderProps<Props extends {} = any, NonStaticPropNames extends keyof Props = never> = [
	NonStaticPropNames,
] extends [never]
	? Props
	: Omit<Props, NonStaticPropNames>

export interface StaticRenderProvider<Props extends {} = any, NonStaticPropNames extends keyof Props = never> {
	staticRender: (
		props: StaticRenderProps<Props, NonStaticPropNames>,
		environment: Environment,
	) => React.ReactElement | null
}

export type CompleteMarkerProvider<
	Props extends {} = any,
	NonStaticPropNames extends keyof Props = never
> = EnvironmentDeltaProvider<Props> &
	FieldMarkerProvider<Props> &
	SubTreeMarkerProvider<Props> &
	RelationMarkerProvider<Props> &
	StaticRenderProvider<Props, NonStaticPropNames>

export type MarkerProvider<Props extends {} = any, NonStaticPropNames extends keyof Props = never> = Partial<
	CompleteMarkerProvider<Props, NonStaticPropNames>
>
