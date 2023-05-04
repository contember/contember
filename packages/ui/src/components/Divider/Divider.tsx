import classNames from 'classnames'
import { memo } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
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
export const Divider = memo(({ className, gap, ...rest }: DividerProps) => {
	const componentClassName = `${useClassNamePrefix()}divider`

	return <div
		className={classNames(
			componentClassName,
			toEnumViewClass(gap),
			className,
		)}
		{...rest}
	/>
})
