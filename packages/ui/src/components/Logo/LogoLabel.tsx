import classNames from 'classnames'
import { memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import { Size } from '../../types'
import { toEnumViewClass } from '../../utils'

export interface LogoLabelProps {
	className?: string
	children: ReactNode
	size?: Size | number
}

/**
 * @group UI
 */
export const LogoLabel = memo(({ className, children, size }: LogoLabelProps) => {
	const prefix = useClassNamePrefix()

	const cls = classNames(
		`${prefix}logo-label`,
		typeof size === 'string' ? toEnumViewClass(size) : undefined,
		className,
	)
	const style = typeof size === 'number' ? { fontSize: `${size >= 0 ? size : 1}em` } : undefined

	return (
		<div className={cls} style={style}>
			{children}
		</div>
	)
})
