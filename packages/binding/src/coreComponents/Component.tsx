import * as React from 'react'
import { Environment } from '../dao'
import { assertNever } from '../utils'
import { MarkerProvider, SyntheticChildrenProvider } from './MarkerProvider'

function Component<P extends {}>(
	statelessRender: React.FunctionComponent<P>,
	displayName?: string,
): React.NamedExoticComponent<P> & SyntheticChildrenProvider<P>
function Component<P extends {}>(
	statefulRender: React.FunctionComponent<P>,
	generateSyntheticChildren: (props: P, environment: Environment) => React.ReactNode,
	displayName?: string,
): React.NamedExoticComponent<P> & SyntheticChildrenProvider<P>
function Component<P extends {}>(
	statefulRender: React.FunctionComponent<P>,
	markerProvisions: MarkerProvider<P>,
	displayName?: string,
): React.NamedExoticComponent<P> & MarkerProvider<P>
function Component<P extends {}>(
	render: React.FunctionComponent<P>,
	decider?: string | ((props: P, environment: Environment) => React.ReactNode) | MarkerProvider<P>,
	displayName?: string,
) {
	let augmentedRender: React.NamedExoticComponent<P> & MarkerProvider<P>
	if (decider === undefined || typeof decider === 'string') {
		render.displayName = decider
		augmentedRender = React.memo<P>(render)
		augmentedRender.generateSyntheticChildren = render

		return augmentedRender as React.NamedExoticComponent<P> & SyntheticChildrenProvider<P>
	}

	render.displayName = displayName
	augmentedRender = React.memo<P>(render)

	if (typeof decider === 'function') {
		augmentedRender.generateSyntheticChildren = decider

		return augmentedRender
	}
	if (typeof decider === 'object') {
		for (const provisionName in decider) {
			const methodName = provisionName as keyof MarkerProvider<P>
			;(augmentedRender[methodName] as MarkerProvider<P>[typeof methodName]) = decider[methodName]
		}

		return augmentedRender
	}
	assertNever(decider)
}

export { Component }
