import { NavigationContext } from '@contember/ui'
import { memo, ReactNode } from 'react'
import { isLinkTarget, useLinkFactory } from '../Link'
import { PageNotFound } from '../../routing'

export interface NavigationProviderProps {
	children?: ReactNode
}

export const NavigationProvider = memo(function NavigationProvider(props: NavigationProviderProps) {
	const linkFactory = useLinkFactory()
	return (
		<NavigationContext.Provider
			value={val => {
				if (!isLinkTarget(val)) {
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
