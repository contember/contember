import { ColorSchemeProvider, useClassNameFactory } from '@contember/react-utils'
import { colorSchemeClassName } from '@contember/utilities'
import { ReactNode, forwardRef, memo } from 'react'
import type { HoveringToolbarScope, Scheme } from '../../types'
import { toEnumViewClass, toStateClass } from '../../utils'

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
		<ColorSchemeProvider scheme={scheme ?? 'dark'}>
			<div
				className={componentClassName(null, [
					toStateClass('active', isActive),
					toEnumViewClass(scope),
					colorSchemeClassName(scheme ?? 'dark'),
				])}
				ref={ref}
			>
				<div className={componentClassName('content')}>
					{children}
				</div>
			</div>
		</ColorSchemeProvider>
	)
}))
HoveringToolbar.displayName = 'HoveringToolbar'
