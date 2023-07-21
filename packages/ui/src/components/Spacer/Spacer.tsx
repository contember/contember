import { useClassName } from '@contember/react-utils'
import { ComponentClassNameProps, dataAttribute } from '@contember/utilities'
import { memo } from 'react'
import { HTMLDivElementProps, Size } from '../../types'
import { toEnumViewClass } from '../../utils'

export type SpacerProps =
	& ComponentClassNameProps
	& Omit<HTMLDivElementProps, 'ref' | 'children'>
	& {
		shrink?: boolean
		grow?: boolean
		gap?: Size | 'medium' | 'xlarge' | 'none'
	}


/**
 * @group UI
 */
export const Spacer = memo(({ className, componentClassName = 'spacer', gap, grow, shrink, ...rest }: SpacerProps) => {
	return <div
		data-gap={dataAttribute(gap)}
		data-grow={dataAttribute(grow)}
		data-shrink={dataAttribute(shrink)}
		className={useClassName(componentClassName, className)}
		{...rest}
	/>
})
