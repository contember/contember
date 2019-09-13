import * as React from 'react'
import { useSelector } from 'react-redux'
import { PageLink } from '../pageRouting'
import { DynamicLink } from '../DynamicLink'
import { Navigation } from '@contember/ui'
import State from '../../state'
import { requestStateToPath } from '../../utils/url'
import routes from '../../routes'
import { pageRequest } from '../../state/request'

export interface NavigationIsActiveProviderProps {
	children?: React.ReactNode
}

export function NavigationIsActiveProvider(props: NavigationIsActiveProviderProps) {
	const isActive = useSelector<State, (to: Navigation.IsActiveProps['to']) => boolean>(state => {
		return (to: Navigation.IsActiveProps['to']) => {
			if (state.view.route && state.view.route.name === 'project_page') {
				const url = requestStateToPath(
					routes(state.projectsConfigs.configs),
					pageRequest(
						state.view.route.project,
						state.view.route.stage,
						typeof to === 'string' ? to : to.pageName,
						typeof to === 'string' ? {} : to.parameters,
					)(state.request),
				)
				return url === location.pathname
			} else {
				return false
			}
		}
	})

	return (
		<Navigation.IsActiveContext.Provider
			value={(props: Navigation.IsActiveProps) => {
				return <>{props.children(isActive(props.to))}</>
			}}
		>
			{props.children}
		</Navigation.IsActiveContext.Provider>
	)
}

export interface NavigationProviderProps {
	children?: React.ReactNode
}

export function NavigationProvider(props: NavigationProviderProps) {
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
										return { ...requestState, pageName: to }
									}
									return { ...requestState, ...to }
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
}
