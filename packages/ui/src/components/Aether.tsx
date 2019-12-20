import cn from 'classnames'
import * as React from 'react'
import { useComponentClassName } from '../auxiliary'

export type AetherProps = JSX.IntrinsicElements['div']

export const Aether = React.memo(({ children, className, ...divProps }: AetherProps) => (
	<div className={cn(useComponentClassName('aether'), className)} {...divProps}>
		{children}
	</div>
))
Aether.displayName = 'Aether'
