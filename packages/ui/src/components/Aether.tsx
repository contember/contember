import * as React from 'react'
import cn from 'classnames'

export type AetherProps = JSX.IntrinsicElements['div']

export const Aether = React.memo(({ children, className, ...divProps }: AetherProps) => (
	<div className={cn('aether', className)} {...divProps}>
		{children}
	</div>
))
Aether.displayName = 'Aether'
