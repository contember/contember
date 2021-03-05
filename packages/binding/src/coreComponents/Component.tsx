import { FunctionComponent, memo, NamedExoticComponent, ReactElement } from 'react'
import { Environment } from '../dao'
import { assertNever } from '../utils'
import { MarkerProvider, StaticRenderProvider, StaticRenderProviderProps } from './MarkerProvider'

function Component<Props extends {}>(
	statelessRender: FunctionComponent<Props>,
	displayName?: string,
): NamedExoticComponent<Props> & StaticRenderProvider<Props>
function Component<Props extends {}, NonStaticPropNames extends keyof Props = never>(
	statefulRender: FunctionComponent<Props>,
	staticRender: (
		props: StaticRenderProviderProps<Props, NonStaticPropNames>,
		environment: Environment,
	) => ReactElement | null,
	displayName?: string,
): NamedExoticComponent<Props> & StaticRenderProvider<Props, NonStaticPropNames>
function Component<Props extends {}, NonStaticPropNames extends keyof Props = never>(
	statefulRender: FunctionComponent<Props>,
	markerProvisions: MarkerProvider<Props, NonStaticPropNames>,
	displayName?: string,
): NamedExoticComponent<Props> & MarkerProvider<Props, NonStaticPropNames>
function Component<Props extends {}, NonStaticPropNames extends keyof Props = never>(
	render: FunctionComponent<Props>,
	decider?:
		| string
		| ((props: StaticRenderProviderProps<Props, NonStaticPropNames>, environment: Environment) => ReactElement | null)
		| MarkerProvider<Props, NonStaticPropNames>,
	displayName?: string,
) {
	if (decider === undefined || typeof decider === 'string') {
		render.displayName = decider
		const augmentedRender: NamedExoticComponent<Props> & MarkerProvider<Props> = memo<Props>(render)
		augmentedRender.staticRender = render as StaticRenderProvider<Props>['staticRender']

		return augmentedRender
	}

	render.displayName = displayName
	const augmentedRender: NamedExoticComponent<Props> & MarkerProvider<Props, NonStaticPropNames> = memo<Props>(render)

	if (typeof decider === 'function') {
		augmentedRender.staticRender = decider

		return augmentedRender
	}
	if (typeof decider === 'object') {
		for (const provisionName in decider) {
			const methodName = provisionName as keyof MarkerProvider<Props, NonStaticPropNames>
			;(augmentedRender[methodName] as MarkerProvider<Props, NonStaticPropNames>[typeof methodName]) = decider[
				methodName
			]
		}

		return augmentedRender
	}
	assertNever(decider)
}

export { Component }
