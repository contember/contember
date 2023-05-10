import classNames from 'classnames'
import { memo } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import type { Size } from '../../types'
import { toEnumViewClass } from '../../utils'

export interface DividerProps extends Omit<JSX.IntrinsicElements['div'], 'children'> {
	gap?: Size | 'xlarge' | 'none'
}

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
