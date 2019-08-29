import * as React from 'react'
import { PageLink } from '../pageRouting'
import { DynamicLink } from '../DynamicLink'
import { Navigation } from '@contember/ui'

export interface NavigationProviderProps {
	children?: React.ReactNode
}

export function NavigationProvider(props: NavigationProviderProps) {
	return (
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
	)
}
