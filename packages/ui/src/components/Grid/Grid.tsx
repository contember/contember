import { useClassName } from '@contember/react-utils'
import { CSSProperties, forwardRef, memo, useMemo } from 'react'
import { HTMLDivElementProps } from '../../types'

export interface GridOwnProps {
	columnWidth: number
}

export type GridProps =
	& GridOwnProps
	& HTMLDivElementProps

/**
 * @group UI
 */
export const Grid = memo(forwardRef<HTMLDivElement, GridProps>(({
	className,
	columnWidth,
	children,
	style: styleProp,
	...rest
}, forwardedRef) => {
	if (columnWidth < 0) {
		throw new Error('Column width must be a non-negative number')
	}

	const style: CSSProperties | undefined = useMemo(() => columnWidth ? ({
		['--cui-grid-column-width' as any]: `${columnWidth}px`,
		...styleProp,
	}) : styleProp, [columnWidth, styleProp])

	return (
		<div
			ref={forwardedRef}
			className={useClassName('grid', className)}
			style={style}
			{...rest}
		>
			{children}
		</div>
	)
}))
Grid.displayName = 'Grid'
