import classNames from 'classnames'
import { memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../auxiliary'

export interface DescriptionProps {
	className?: string
	children: ReactNode
}

/**
 * @group UI
 */
export const Description = memo(({ className, children }: DescriptionProps) => {
	const prefix = useClassNamePrefix()

	return <span className={classNames(`${prefix}description`, className)}>{children}</span>
})

Description.displayName = 'Description'
