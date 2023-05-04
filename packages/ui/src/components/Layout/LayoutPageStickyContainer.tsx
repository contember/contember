import classNames from 'classnames'
import { CSSProperties, memo, ReactNode, useMemo } from 'react'
import { useComponentClassName } from '../../auxiliary'
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
		'--cui-sticky-container-offset-left': left,
		'--cui-sticky-container-offset-right': right,
		'bottom': bottom,
		'top': top,
		...styleProp,
	}), [bottom, left, right, styleProp, top])

	return <div {...rest} className={classNames(
		useComponentClassName('layout-page-sticky-container'),
		classNameProp,
	)} style={style}>{children}</div>
})
LayoutPageStickyContainer.displayName = 'LayoutPageStickyContainer'
