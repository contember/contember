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
			value={({ target, children, ...props }: Navigation.MiddlewareProps) => {
				if ('Component' in props) {
					const Component = props.Component
					return (
						<DynamicLink
							requestChange={requestState => {
								if (typeof target === 'string') {
									return { ...requestState, pageName: target }
								}
								return { ...requestState, ...target }
							}}
							Component={innerProps => (
								<Component navigate={() => innerProps.onClick()}>{innerProps.children}</Component>
							)}
						>
							<>{children}</>
						</DynamicLink>
					)
				}
				return (
					<PageLink
						change={() => {
							if (typeof target === 'string') {
								return {
									name: target,
								}
							}
							return {
								name: target.pageName,
								params: target.parameters,
							}
						}}
						{...props}
					>
						{children}
					</PageLink>
				)
			}}
		>{props.children}</Navigation.MiddlewareContext.Provider>
	)
}
