import { NavigationContext } from '@contember/ui'
import { ReactNode } from 'react'
import { isRoutingLinkTarget, PageNotFound, useRoutingLinkFactory } from '../../routing'

export interface NavigationProviderProps {
	children?: ReactNode
}

export const NavigationProvider = (props: NavigationProviderProps) => {
	const linkFactory = useRoutingLinkFactory()
	return (
		<NavigationContext.Provider
			value={val => {
				if (!isRoutingLinkTarget(val)) {
					throw new PageNotFound('Invalid request')
				}
				return linkFactory(val)
			}}
		>
			{props.children}
		</NavigationContext.Provider>
	)
}
