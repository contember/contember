import { createContext, SyntheticEvent, useContext, useMemo } from 'react'

export interface NavigationLinkProps {
	href: string
	navigate: (e?: SyntheticEvent) => void
	isActive: boolean
}
export type NavigationContext = <T extends any>(to: T) => NavigationLinkProps

export const NavigationContext = createContext<NavigationContext>(to => {
	if (typeof to !== 'string') {
		throw new Error(`If you wish to support custom targets, implement your own navigation middleware.`)
	}
	return {
		href: to,
		navigate: (e?: SyntheticEvent) => {
			location.href = to
			e?.preventDefault()
		},
		isActive: location.pathname === to,
	}
})

export const useNavigationLink = <T extends any>(to: T, href?: string) => {
	const navigationContext = useContext(NavigationContext)
	return useMemo((): Partial<NavigationLinkProps> => {
		if (to === undefined) {
			return { href }
		}
		return navigationContext(to)
	}, [to, navigationContext, href])
}
