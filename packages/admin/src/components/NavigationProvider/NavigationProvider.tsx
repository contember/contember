import { NavigationContext } from '@contember/ui'
import { memo, ReactNode } from 'react'
import { isRoutingLinkTarget, PageNotFound, useRoutingLinkFactory } from '../../routing'

export interface NavigationProviderProps {
	children?: ReactNode
}

export const NavigationProvider = memo(function NavigationProvider(props: NavigationProviderProps) {
	const linkFactory = useRoutingLinkFactory()
	return (
		<NavigationContext.Provider
			value={val => {
				if (!isRoutingLinkTarget(val)) {
					throw new PageNotFound('Invalid request')
				}
				return linkFactory(val as any)
			}}
		>
			{props.children}
		</NavigationContext.Provider>
	)
})
NavigationProvider.displayName = 'NavigationProvider'
