import { useClassName } from '@contember/react-utils'
import { deprecate } from '@contember/utilities'
import { ReactNode, memo } from 'react'
import { Size } from '../../types'
import { toEnumViewClass } from '../../utils'

export interface LogoLabelProps {
	className?: string
	children: ReactNode
	size?: Size | number
}

/**
 * @group UI
 * @deprecated No alternative since 1.4.0
 */
export const LogoLabel = memo(({ className, children, size }: LogoLabelProps) => {
	deprecate('1.4.0', true, 'LogoLabel', null)

	return (
		<div
			className={useClassName('logo-label', [
				typeof size === 'string' ? toEnumViewClass(size) : undefined,
				className,
			])}
			style={typeof size === 'number' ? { fontSize: `${size >= 0 ? size : 1}em` } : undefined}
		>{children}</div>
	)
})
