import classNames from 'classnames'
import { memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
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
 */
export const LogoSymbol = memo(({ className, children, size }: LogoSymbolProps) => {
	const prefix = useClassNamePrefix()
	return (
		<div
			className={classNames(
				`${prefix}logo-symbol`,
				typeof size === 'string' ? toEnumViewClass(size) : undefined,
				className,
			)}
			style={typeof size === 'number' ? { fontSize: `${size >= 0 ? size : 1}em` } : undefined}
		>
			{children}
		</div>
	)
})

LogoSymbol.displayName = 'LogoSymbol'
