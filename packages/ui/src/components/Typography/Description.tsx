import { useClassName } from '@contember/utilities'
import { ReactNode, memo } from 'react'

export interface DescriptionProps {
	className?: string
	children: ReactNode
}

/**
 * @group UI
 */
export const Description = memo(({ className, children }: DescriptionProps) => {
	return <span className={useClassName('description', className)}>{children}</span>
})

Description.displayName = 'Description'
