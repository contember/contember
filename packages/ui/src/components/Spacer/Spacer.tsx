import { useClassName } from '@contember/react-utils'
import { dataAttribute } from '@contember/utilities'
import { memo } from 'react'
import { HTMLDivElementProps, Size } from '../../types'
import { toEnumViewClass } from '../../utils'

export type SpacerProps =
	& {
		shrink?: boolean
		grow?: boolean
		gap?: Size | 'xlarge' | 'none'
	}
	& Omit<HTMLDivElementProps, 'ref'>


/**
 * @group UI
 */
export const Spacer = memo(({ className, gap, grow, shrink, ...rest }: SpacerProps) => {
	return <div
		data-gap={dataAttribute(gap)}
		data-grow={dataAttribute(grow)}
		data-shrink={dataAttribute(shrink)}
		className={useClassName('spacer', [
			toEnumViewClass(gap),
			className,
		])}
		{...rest}
	/>
})
