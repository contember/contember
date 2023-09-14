import { useClassName } from '@contember/react-utils'
import { deprecate } from '@contember/utilities'
import { ReactNode, memo } from 'react'
import type { Size } from '../../types'
import { toEnumViewClass } from '../../utils'
export interface LogoSymbolProps {
	className?: string
	children: ReactNode
	size?: Size | number
}

// TODO: repeated IDS

/**
 * @group UI
 * @deprecated Use `import { Identity2023 } from '@contember/brand'` instead since 1.4.0
 */
export const LogoSymbol = memo(({ className, children, size }: LogoSymbolProps) => {
	deprecate('1.4.0', true, 'LogoSymbol', null)

	return (
		<div
			className={useClassName('logo-symbol', [
				typeof size === 'string' ? toEnumViewClass(size) : undefined,
				className,
			])}
			style={typeof size === 'number' ? { fontSize: `${size >= 0 ? size : 1}em` } : undefined}
		>
			{children}
		</div>
	)
})

LogoSymbol.displayName = 'LogoSymbol'
