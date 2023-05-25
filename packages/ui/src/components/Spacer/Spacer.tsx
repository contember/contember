import { useClassName } from '@contember/utilities'
import { memo } from 'react'
import { HTMLDivElementProps, Size } from '../../types'
import { toEnumViewClass } from '../../utils'

export type SpacerProps =
	& {
		gap?: Size | 'xlarge' | 'none'
	}
	& Omit<HTMLDivElementProps, 'ref'>


/**
 * @group UI
 */
export const Spacer = memo(({ className, gap, ...rest }: SpacerProps) => {
	return <div
		className={useClassName('spacer', [
			toEnumViewClass(gap),
			className,
		])}
		{...rest}
	/>
})
