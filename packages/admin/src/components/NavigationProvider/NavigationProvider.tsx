import { Navigation } from '@contember/ui'
import { memo, ReactNode, useCallback } from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import type State from '../../state'
import { PageRequest, pageRequest } from '../../state/request'
import { isUrlActive } from '../../utils/isUrlActive'
import { DynamicLink } from '../DynamicLink'
import { PageLink, useUrlGenerator } from '../pageRouting'

export interface NavigationIsActiveProviderProps {
	children?: ReactNode
}

export const NavigationIsActiveProvider = memo(function NavigationIsActiveProvider(
	props: NavigationIsActiveProviderProps,
) {
	const viewRoute = useSelector((state: State): PageRequest<any> | null => {
		return state.request
	}, shallowEqual)
	const request = useSelector((state: State) => state.request, shallowEqual)
	const urlGenerator = useUrlGenerator()

	const isActive = useCallback(
		(to: string | Navigation.CustomTo) => {
			if (viewRoute === null) {
				return false
			}

			const url = urlGenerator(pageRequest(
				viewRoute.project,
				viewRoute.stage,
				typeof to === 'string' ? to : to.pageName,
				typeof to === 'string' ? {} : to.parameters,
			)(request))

			return isUrlActive(url)
		},
		[request, urlGenerator, viewRoute],
	)

	return <Navigation.IsActiveContext.Provider value={isActive}>{props.children}</Navigation.IsActiveContext.Provider>
})
NavigationIsActiveProvider.displayName = 'NavigationIsActiveProvider'

export interface NavigationProviderProps {
	children?: ReactNode
}

export const NavigationProvider = memo(function NavigationProvider(props: NavigationProviderProps) {
	return (
		<NavigationIsActiveProvider>
			<Navigation.MiddlewareContext.Provider
				value={({ to, children, ...props }: Navigation.MiddlewareProps) => {
					if ('Component' in props) {
						const Component = props.Component
						return (
							<DynamicLink
								requestChange={requestState => {
									if (typeof to === 'string') {
										return { ...requestState!, pageName: to }
									}
									return { ...requestState!, ...to }
								}}
								Component={innerProps => (
									<Component navigate={() => innerProps.onClick()} isActive={innerProps.isActive}>
										{innerProps.children}
									</Component>
								)}
							>
								<>{children}</>
							</DynamicLink>
						)
					}
					return (
						<PageLink
							to={
								typeof to === 'string'
									? to
									: () => ({
											name: to.pageName,
											params: to.parameters,
									  })
							}
							{...props}
						>
							{children}
						</PageLink>
					)
				}}
			>
				{props.children}
			</Navigation.MiddlewareContext.Provider>
		</NavigationIsActiveProvider>
	)
})
NavigationProvider.displayName = 'NavigationProvider'
