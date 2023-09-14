import { memo, NamedExoticComponent, PropsWithChildren, ReactElement } from 'react'
import { useEnvironment } from '../accessorPropagation'
import type { Environment } from '@contember/binding'
import type { MarkerProvider, StaticRenderProvider, StaticRenderProviderProps } from './MarkerProvider'
import { assertNever } from '../utils/assertNever'

interface EnvironmentAwareFunctionComponent<P> {
	(props: PropsWithChildren<P>, environment: Environment): ReactElement<any, any> | null;
	displayName?: string | undefined;
}

function Component<Props extends {}>(
	statelessRender: EnvironmentAwareFunctionComponent<Props>,
	displayName?: string,
): NamedExoticComponent<Props>

function Component<Props extends {}, NonStaticPropNames extends keyof Props = never>(
	statefulRender: EnvironmentAwareFunctionComponent<Props>,
	staticRender: (
		props: StaticRenderProviderProps<Props, NonStaticPropNames>,
		environment: Environment,
	) => ReactElement | null,
	displayName?: string,
): NamedExoticComponent<Props>

function Component<Props extends {}, NonStaticPropNames extends keyof Props = never>(
	statefulRender: EnvironmentAwareFunctionComponent<Props>,
	markerProvisions: MarkerProvider<Props, NonStaticPropNames>,
	displayName?: string,
): NamedExoticComponent<Props>

function Component<Props extends {}, NonStaticPropNames extends keyof Props = never>(
	render: EnvironmentAwareFunctionComponent<Props>,
	decider?:
		| string
		| ((props: StaticRenderProviderProps<Props, NonStaticPropNames>, environment: Environment) => ReactElement | null)
		| MarkerProvider<Props, NonStaticPropNames>,
	displayName?: string,
) {
	const RenderWithEnv = (props: Props) => render(props, useEnvironment())
	const renderWithEnv = typeof render !== 'function' || render.length < 2 ? render : RenderWithEnv

	if (decider === undefined || typeof decider === 'string') {
		render.displayName = decider
		const augmentedRender: NamedExoticComponent<Props> & MarkerProvider<Props> = memo<Props>(renderWithEnv)
		augmentedRender.staticRender = render as StaticRenderProvider<Props>['staticRender']
		augmentedRender.displayName = decider

		return augmentedRender
	}

	render.displayName = displayName
	const augmentedRender: NamedExoticComponent<Props> & MarkerProvider<Props, NonStaticPropNames> = memo<Props>(renderWithEnv)
	augmentedRender.displayName = displayName

	if (typeof decider === 'function') {
		augmentedRender.staticRender = decider

		return augmentedRender
	}
	if (typeof decider === 'object') {
		for (const provisionName in decider) {
			const methodName = provisionName as keyof MarkerProvider<Props, NonStaticPropNames>
			;(augmentedRender[methodName] as MarkerProvider<Props, NonStaticPropNames>[typeof methodName]) =
				decider[methodName]
		}

		return augmentedRender
	}
	assertNever(decider)
}

export type { EnvironmentAwareFunctionComponent }
export { Component }
