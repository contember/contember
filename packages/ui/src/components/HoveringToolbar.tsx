import * as React from 'react'
import cn from 'classnames'
import { useComponentClassName } from '../auxiliary'
import { toStateClass } from '../utils'
import { ButtonGroup } from './forms'
import { Portal } from './Portal'

export interface HoveringToolbarProps {
	isActive?: boolean
	children: React.ReactNode
}

export const HoveringToolbar = React.memo(
	React.forwardRef<HTMLDivElement, HoveringToolbarProps>(({ isActive, children }: HoveringToolbarProps, ref) => (
		<Portal>
			<div className={cn(useComponentClassName('hoveringToolbar'), toStateClass('active', isActive))} ref={ref}>
				<ButtonGroup>{children}</ButtonGroup>
			</div>
		</Portal>
	)),
)
HoveringToolbar.displayName = 'HoveringToolbar'
