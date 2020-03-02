import cn from 'classnames'
import * as React from 'react'
import { useComponentClassName } from '../../auxiliary'
import { HoveringToolbarScope } from '../../types'
import { toEnumViewClass, toStateClass } from '../../utils'

export interface HoveringToolbarProps {
	isActive?: boolean
	scope?: HoveringToolbarScope
	children: React.ReactNode
}

export const HoveringToolbar = React.memo(
	React.forwardRef<HTMLDivElement, HoveringToolbarProps>(({ isActive, scope, children }: HoveringToolbarProps, ref) => (
		<div
			className={cn(useComponentClassName('hoveringToolbar'), toStateClass('active', isActive), toEnumViewClass(scope))}
			ref={ref}
		>
			{children}
		</div>
	)),
)
HoveringToolbar.displayName = 'HoveringToolbar'
