import cn from 'classnames'
import { forwardRef, memo, ReactNode } from 'react'
import { useComponentClassName } from '../../auxiliary'
import type { HoveringToolbarScope } from '../../types'
import { toEnumViewClass, toStateClass } from '../../utils'

export interface HoveringToolbarProps {
	isActive?: boolean
	scope?: HoveringToolbarScope
	children: ReactNode
}

export const HoveringToolbar = memo(
	forwardRef<HTMLDivElement, HoveringToolbarProps>(({ isActive, scope, children }: HoveringToolbarProps, ref) => (
		<div
			className={cn(useComponentClassName('hoveringToolbar'), toStateClass('active', isActive), toEnumViewClass(scope))}
			ref={ref}
		>
			{children}
		</div>
	)),
)
HoveringToolbar.displayName = 'HoveringToolbar'
