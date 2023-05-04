import type { ReactNode } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import type { Size } from '../../types'
import { LogoLabel } from './LogoLabel'
import { LogoSymbol } from './LogoSymbol'

export interface LogoProps {
	children?: ReactNode
	image?: ReactNode
	size?: Size | number
}

/**
 * @group UI
 */
export function Logo({ children, image, size }: LogoProps) {
	const prefix = useClassNamePrefix()

	return (
		<div className={`${prefix}logo`}>
			{image && <LogoSymbol size={size}>{image}</LogoSymbol>}
			{children && <LogoLabel size={size}>{children}</LogoLabel>}
		</div>
	)
}
Logo.displayName = 'Logo'
