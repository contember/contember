import { useClassName, useClassNameFactory } from '@contember/utilities'
import { memo } from 'react'
import { HTMLDivElementProps, Size } from '../../types'
import { toEnumViewClass } from '../../utils'

export type DividerProps =
	& {
		gap?: Size | 'xlarge' | 'none'
	}
	& Omit<HTMLDivElementProps, 'children'>

/**
 * @group UI
 */
export const Divider = memo(({ className, gap, ...rest }: DividerProps) => (
	<div
		className={useClassName('divider', [
			toEnumViewClass(gap),
			className,
		])}
		{...rest}
	/>
))
