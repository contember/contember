import { Navigation } from '@contember/ui'
import { memo, ReactNode, useCallback } from 'react'
import { PageLink } from '../pageRouting'
import { Link } from '../Link'
import { useLinkFactory } from '../Link/useLink'

export interface NavigationIsActiveProviderProps {
	children?: ReactNode
}

export const NavigationIsActiveProvider = memo(function NavigationIsActiveProvider(
	props: NavigationIsActiveProviderProps,
) {
	const linkFactory = useLinkFactory()
	const isActive = useCallback(
		(to: string | Navigation.CustomTo) => {
			return linkFactory(to).isActive
		},
		[linkFactory],
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
							<Link
								to={requestState => {
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
							</Link>
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
