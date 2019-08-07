import { assertNever } from 'cms-common'
import * as React from 'react'
import {
	CompleteMarkerProvider,
	MarkerProvider,
	Props,
	RenderFunction,
	SyntheticChildrenProvider,
} from '../../coreComponents'
import { Environment } from '../../dao'

function Component<P extends {}>(
	statelessRender: React.FunctionComponent<P>,
	displayName?: string,
): RenderFunction<P> & SyntheticChildrenProvider<P>
function Component<P extends {}>(
	statefulRender: React.FunctionComponent<P>,
	generateSyntheticChildren: (props: Props<P>, environment: Environment) => React.ReactNode,
	displayName?: string,
): RenderFunction<P> & SyntheticChildrenProvider<P>
function Component<P extends {}>(
	statefulRender: React.FunctionComponent<P>,
	markerProvisions: MarkerProvider<P>,
	displayName?: string,
): RenderFunction<P> & MarkerProvider<P>
function Component<P extends {}>(
	render: React.FunctionComponent<P>,
	decider?: string | ((props: Props<P>, environment: Environment) => React.ReactNode) | MarkerProvider<P>,
	displayName?: string,
) {
	const augmentedRender: React.NamedExoticComponent<P> & MarkerProvider<P> = React.memo<P>(render)
	const defaultName = 'UserComponent'

	if (decider === undefined || typeof decider === 'string') {
		augmentedRender.displayName = decider || defaultName
		augmentedRender.generateSyntheticChildren = render

		return augmentedRender as RenderFunction<P> & SyntheticChildrenProvider<P>
	}
	if (typeof decider === 'function') {
		augmentedRender.displayName = displayName || defaultName
		augmentedRender.generateSyntheticChildren = decider

		return augmentedRender
	}
	if (typeof decider === 'object') {
		augmentedRender.displayName = displayName || defaultName

		for (const provisionName in decider as CompleteMarkerProvider<P>) {
			const methodName = provisionName as keyof MarkerProvider<P>
			;(augmentedRender[methodName] as MarkerProvider<P>[typeof methodName]) = decider[methodName]
		}

		return augmentedRender
	}
	return assertNever(decider)
}

export { Component }
