import { useClassName } from '@contember/utilities'
import { ReactNode, createContext, memo, useEffect, useRef, useState } from 'react'
import { PortalProvider } from '../components'

/**
 * @deprecated use `PortalProvider` instead
 * @see PortalProvider
 */
export const DropdownContentContainerContext = createContext<HTMLElement | undefined>(undefined)
DropdownContentContainerContext.displayName = 'DropdownContentContainerContext'

/**
 * @deprecated use `PortalProvider` instead
 * @see PortalProvider
 */
export interface DropdownContainerProviderProps {
	children?: ReactNode
}

/**
 * @deprecated use `PortalProvider` instead
 * @see PortalProvider
 */
export const DropdownContentContainerProvider = memo((props: DropdownContainerProviderProps) => {
	const [contentContainer, setContentContainer] = useState<HTMLElement | undefined>(undefined)
	const contentContainerRef = useRef<HTMLDivElement>(null)
	useEffect(() => {
		// Run once ref is set
		setContentContainer(contentContainerRef.current || undefined)
	}, [])
	return (
		<div className={useClassName('dropdown-contentContainer')} ref={contentContainerRef}>
			<DropdownContentContainerContext.Provider value={contentContainer}>
				{props.children}
			</DropdownContentContainerContext.Provider>
		</div>
	)
})
DropdownContentContainerProvider.displayName = 'DropdownContentContainerProvider'
