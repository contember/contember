import * as React from 'react'
import { Environment, FieldMarker, MarkerTreeRoot, ReferenceMarker } from '../dao'

export interface RenderFunction<P = any> {
	(props: Props<P>): React.ReactElement | null
}

export interface DataBindingComponent {
	displayName: string
}

export type Props<P> = React.PropsWithChildren<P>

export interface EnvironmentDeltaProvider<P = any> extends DataBindingComponent {
	generateEnvironmentDelta: (props: Props<P>, oldEnvironment: Environment) => Partial<Environment.NameStore>
}

export interface FieldMarkerProvider<P = any> extends DataBindingComponent {
	generateFieldMarker: (props: Props<P>, environment: Environment) => FieldMarker
}

export interface MarkerTreeRootProvider<P = any> extends DataBindingComponent {
	generateMarkerTreeRoot: (
		props: Props<P>,
		fields: MarkerTreeRoot['fields'],
		environment: Environment
	) => MarkerTreeRoot
}

export interface ReferenceMarkerProvider<P = any> extends DataBindingComponent {
	generateReferenceMarker: (
		props: P,
		fields: ReferenceMarker.Reference['fields'],
		environment: Environment
	) => ReferenceMarker
}

export interface SyntheticChildrenProvider<P = any> extends DataBindingComponent {
	generateSyntheticChildren: (props: Props<P>, environment: Environment) => React.ReactNode
}

export type MarkerProvider = Partial<
	| EnvironmentDeltaProvider
	| FieldMarkerProvider
	| MarkerTreeRootProvider
	| ReferenceMarkerProvider
	| SyntheticChildrenProvider
> &
	DataBindingComponent
