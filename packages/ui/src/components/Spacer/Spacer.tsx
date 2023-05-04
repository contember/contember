import classNames from 'classnames'
import { memo } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
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
	const componentClassName = `${useClassNamePrefix()}spacer`

	return <div
		className={classNames(
			componentClassName,
			toEnumViewClass(gap),
			className,
		)}
		{...rest}
	/>
})
