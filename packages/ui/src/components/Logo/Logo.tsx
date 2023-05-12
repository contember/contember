import { useClassName } from '@contember/utilities'
import type { ReactNode } from 'react'
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
	return (
		<div className={useClassName('logo')}>
			{image && <LogoSymbol size={size}>{image}</LogoSymbol>}
			{children && <LogoLabel size={size}>{children}</LogoLabel>}
		</div>
	)
}
Logo.displayName = 'Logo'
