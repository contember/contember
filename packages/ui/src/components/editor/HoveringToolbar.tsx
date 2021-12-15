import classNames from 'classnames'
import { forwardRef, memo, ReactNode } from 'react'
import { useComponentClassName } from '../../auxiliary'
import type { HoveringToolbarScope, Scheme } from '../../types'
import { toEnumClass, toEnumViewClass, toStateClass } from '../../utils'

export interface HoveringToolbarProps {
	isActive?: boolean
	scope?: HoveringToolbarScope
	children: ReactNode
	scheme?: Scheme
}

export const HoveringToolbar = memo(
	forwardRef<HTMLDivElement, HoveringToolbarProps>(({ isActive, scope, scheme, children }: HoveringToolbarProps, ref) => {
		const componentClassName = useComponentClassName('hoveringToolbar')

		return <div
			className={classNames(
				componentClassName,
				toStateClass('active', isActive),
				toEnumViewClass(scope),
				toEnumClass('scheme-', scheme ?? 'dark'),
			)}
			ref={ref}
		>
			<div className={`${componentClassName}-content`}>
				{children}
			</div>
		</div>
	}),
)
HoveringToolbar.displayName = 'HoveringToolbar'
