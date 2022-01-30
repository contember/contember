import { NavigationContext } from '@contember/ui'
import { ReactNode } from 'react'
import { isRoutingLinkTarget, PageNotFound, parseLinkTarget, useRoutingLinkFactory } from '../../routing'
import { useEnvironment } from '@contember/binding'

export interface NavigationProviderProps {
	children?: ReactNode
}

export const NavigationProvider = (props: NavigationProviderProps) => {
	const env = useEnvironment()
	const linkFactory = useRoutingLinkFactory()

	return (
		<NavigationContext.Provider
			value={val => {
				if (!isRoutingLinkTarget(val)) {
					throw new PageNotFound('Invalid request')
				}
				return linkFactory(parseLinkTarget(val, env))
			}}
		>
			{props.children}
		</NavigationContext.Provider>
	)
}
