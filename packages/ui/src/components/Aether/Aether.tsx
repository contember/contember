import cn from 'classnames'
import { memo } from 'react'
import { useComponentClassName } from '../../auxiliary'
import { HTMLDivElementProps } from '../../types'

export type AetherProps = HTMLDivElementProps

/**
 * @group UI
 */
export const Aether = memo(({ children, className, ...divProps }: AetherProps) => (
	<div className={cn(useComponentClassName('aether'), className)} {...divProps}>
		{children}
	</div>
))
Aether.displayName = 'Aether'
