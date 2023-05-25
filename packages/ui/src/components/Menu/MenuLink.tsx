import { listClassName } from '@contember/utilities'
import { ReactNode, SyntheticEvent, useCallback } from 'react'
import { isSpecialLinkClick, toStateClass } from '../../utils'

interface MenuLinkProps {
	href: string
	onClick?: (e: SyntheticEvent<HTMLElement>) => void
	suppressTo: boolean
	isActive?: boolean
	className?: string
	external?: boolean | undefined
	children?: ReactNode
}

export function MenuLink({ className, children, external, href, isActive, onClick: onNavigate, suppressTo }: MenuLinkProps) {
	const onClick = useCallback((event: SyntheticEvent<HTMLAnchorElement>) => {
		if (event.nativeEvent instanceof MouseEvent && !isSpecialLinkClick(event.nativeEvent)) {
			onNavigate?.(event)

			if (suppressTo) {
				event.preventDefault()
			}
		}
	}, [onNavigate, suppressTo])

	return <a
		tabIndex={-1}
		className={listClassName([className, toStateClass('active', isActive)])}
		href={href}
		onClick={onClick}
		target={external ? '_blank' : undefined}
		rel={external ? 'noopener noreferrer' : undefined}
	>
		{children}
	</a>
}
