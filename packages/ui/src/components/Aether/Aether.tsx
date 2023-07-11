import { useClassName } from '@contember/react-utils'
import { memo } from 'react'
import { HTMLDivElementProps } from '../../types'

export type AetherProps = HTMLDivElementProps

/**
 * @group UI
 */
export const Aether = memo(({ children, className, ...divProps }: AetherProps) => (
	<div className={useClassName('aether', className)} {...divProps}>
		{children}
	</div>
))
Aether.displayName = 'Aether'
