import { useClassName } from '@contember/react-utils'
import { ComponentClassNameProps, dataAttribute } from '@contember/utilities'
import { memo } from 'react'
import { HTMLDivElementProps, Size } from '../../types'
import { toEnumViewClass } from '../../utils'

export type DividerProps =
	& Omit<HTMLDivElementProps, 'children'>
	& ComponentClassNameProps
	& {
		gap?: Size | 'medium' | 'xlarge' | 'none'
	}

/**
 * @group UI
 */
export const Divider = memo(({ className, componentClassName = 'divider', gap, ...rest }: DividerProps) => (
	<div
		data-gap={dataAttribute(gap)}
		className={useClassName(componentClassName, className)}
		{...rest}
	/>
))
