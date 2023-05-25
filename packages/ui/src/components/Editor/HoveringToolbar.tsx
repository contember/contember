import { useClassNameFactory } from '@contember/utilities'
import { forwardRef, memo, ReactNode } from 'react'
import type { HoveringToolbarScope, Scheme } from '../../types'
import { toEnumViewClass, toSchemeClass, toStateClass } from '../../utils'

export interface HoveringToolbarProps {
	isActive?: boolean
	scope?: HoveringToolbarScope
	children: ReactNode
	scheme?: Scheme
}

export const HoveringToolbar = memo(forwardRef<HTMLDivElement, HoveringToolbarProps>(({
	isActive,
	scope,
	scheme,
	children,
}, ref) => {
	const componentClassName = useClassNameFactory('hoveringToolbar')

	return (
		<div
			className={componentClassName(null, [
				toStateClass('active', isActive),
				toEnumViewClass(scope),
				toSchemeClass(scheme ?? 'dark'),
			])}
			ref={ref}
		>
			<div className={componentClassName('content')}>
				{children}
			</div>
		</div>
	)
}))
HoveringToolbar.displayName = 'HoveringToolbar'
