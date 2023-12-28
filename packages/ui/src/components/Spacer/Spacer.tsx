import { useClassName } from '@contember/react-utils'
import { ComponentClassNameProps, dataAttribute } from '@contember/utilities'
import { memo } from 'react'
import { HTMLDivElementProps } from '../../types'
import { StackOwnProps } from '../Stack'

export interface SpacerOwnProps extends ComponentClassNameProps {
	shrink?: boolean
	grow?: boolean
	gap?: StackOwnProps['gap']
}

export type SpacerProps = Omit<HTMLDivElementProps, 'children' | keyof SpacerOwnProps> & SpacerOwnProps
/**
 * @group UI
 */
export const Spacer = memo(({ className, componentClassName = 'spacer', gap = true, grow, shrink, ...rest }: SpacerProps) => {
	return <div
		data-gap={dataAttribute(gap)}
		data-grow={dataAttribute(grow)}
		data-shrink={dataAttribute(shrink)}
		className={useClassName(componentClassName, className)}
		{...rest}
	/>
})
