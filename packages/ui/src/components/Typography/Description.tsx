import { useClassName } from '@contember/react-utils'
import { ReactNode, memo } from 'react'
import { Text } from './Text'

export interface DescriptionProps {
	className?: string
	children: ReactNode
}

/**
 * @group UI
 */
export const Description = memo(({ className, children }: DescriptionProps) => {
	return <Text className={useClassName('description', className)}>{children}</Text>
})

Description.displayName = 'Description'
