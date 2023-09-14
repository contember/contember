import type { ReactElement } from 'react'
import type { Environment } from '@contember/binding'
import type {
	EntityFieldMarkersContainer,
	EntityFieldsWithHoistablesMarker,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
} from '@contember/binding'

export interface EnvironmentDeltaProvider<Props extends {} = any> {
	generateEnvironment: (props: Props, oldEnvironment: Environment) => Environment
}

/*
 * Components may also return EntityFields which serve as something of a Fragment on the Marker level.
 */

export interface LeafMarkerProvider<Props extends {} = any> {
	generateLeafMarker: (
		props: Props,
		environment: Environment,
	) => FieldMarker | HasOneRelationMarker | EntityFieldMarkersContainer
}

export interface BranchMarkerProvider<Props extends {} = any> {
	generateBranchMarker: (
		props: Props,
		fields: EntityFieldsWithHoistablesMarker | EntityFieldMarkersContainer,
		environment: Environment,
	) => HasOneRelationMarker | HasManyRelationMarker | EntityFieldMarkersContainer | EntityFieldsWithHoistablesMarker
}

// See https://github.com/microsoft/TypeScript/issues/23182#issuecomment-379091887 about the never trick
// This is just to make the typings less confusing and verbose downstream.
export type StaticRenderProviderProps<Props extends {} = any, NonStaticPropNames extends keyof Props = never> = [
	NonStaticPropNames,
] extends [never]
	? Props
	: Omit<Props, NonStaticPropNames>

export interface StaticRenderProvider<Props extends {} = any, NonStaticPropNames extends keyof Props = never> {
	staticRender: (
		props: StaticRenderProviderProps<Props, NonStaticPropNames>,
		environment: Environment,
	) => ReactElement | null
}

export type CompleteMarkerProvider<
	Props extends {} = any,
	NonStaticPropNames extends keyof Props = never,
> = EnvironmentDeltaProvider<Props> &
	LeafMarkerProvider<Props> &
	BranchMarkerProvider<Props> &
	StaticRenderProvider<Props, NonStaticPropNames>

export type MarkerProvider<Props extends {} = any, NonStaticPropNames extends keyof Props = never> = Partial<
	CompleteMarkerProvider<Props, NonStaticPropNames>
>
