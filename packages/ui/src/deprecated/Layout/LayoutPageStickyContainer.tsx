import { useClassName } from '@contember/react-utils'
import { CSSProperties, memo, ReactNode, useMemo } from 'react'
import { HTMLDivElementProps } from '../../types'

export type LayoutPageStickyContainerProps =
	& {
		bottom?: CSSProperties['bottom'],
		children?: ReactNode,
		left?: CSSProperties['left'],
		right?: CSSProperties['right'],
		top?: CSSProperties['top'],
	}
	& HTMLDivElementProps

/**
 * @deprecated Use `LayoutKit` from `@contember/layout` instead.
 */
export const LayoutPageStickyContainer = memo(({
	bottom,
	className: classNameProp,
	children,
	left,
	right,
	style: styleProp,
	top,
	...rest
}: LayoutPageStickyContainerProps) => {
	const style: CSSProperties = useMemo(() => ({
		'--cui-sticky-container--offset-left': left,
		'--cui-sticky-container--offset-right': right,
		'bottom': bottom,
		'top': top,
		...styleProp,
	}), [bottom, left, right, styleProp, top])

	return (
		<div
			{...rest}
			className={useClassName('layout-page-sticky-container', classNameProp)}
			style={style}
		>
			{children}
		</div>
	)
})
LayoutPageStickyContainer.displayName = 'LayoutPageStickyContainer'
