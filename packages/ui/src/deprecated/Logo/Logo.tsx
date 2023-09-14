import { useClassName } from '@contember/react-utils'
import { deprecate } from '@contember/utilities'
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
 * @deprecated Use `import { Identity2023 } from '@contember/brand'` instead since 1.4.0
 */
export function Logo({ children, image, size }: LogoProps) {
	deprecate('1.4.0', true, 'Logo', null)

	return (
		<div className={useClassName('logo')}>
			{image && <LogoSymbol size={size}>{image}</LogoSymbol>}
			{children && <LogoLabel size={size}>{children}</LogoLabel>}
		</div>
	)
}
Logo.displayName = 'Logo'
