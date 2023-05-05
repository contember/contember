import classNames from 'classnames'
import { memo } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import type { Size } from '../../types'
import { toEnumViewClass } from '../../utils'

export interface SpacerProps extends Omit<JSX.IntrinsicElements['div'], 'children'> {
	gap?: Size | 'xlarge' | 'none'
}

export const Spacer = memo<SpacerProps>(({ className, gap, ...rest }) => {
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
