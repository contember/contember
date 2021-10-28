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

export const LogoLabel = memo(({ className, children, size }: LogoLabelProps) => {
	const prefix = useClassNamePrefix()

  return <div className={
    classNames(
      `${prefix}logo-label`,
			typeof size === 'string' ? toEnumViewClass(size) : undefined,
				className,
			)}
			style={typeof size === 'number' ? { fontSize: `${size >= 0 ? size : 1}em` } : undefined}
		>{children}</div>
})
