import { useClassNameFactory } from '@contember/utilities'
import { memo, ReactNode } from 'react'
import type { HTMLDivElementProps } from '../../../types'
import { toStateClass } from '../../../utils'
import { Stack } from '../../Stack'
import { Heading } from '../../Typography/Heading'

export interface FieldSetOwnProps {
	heading?: ReactNode
	children: ReactNode
	isActive?: boolean
}

export type FieldSetProps =
	& FieldSetOwnProps
	& HTMLDivElementProps

/**
 * @group UI
 */
export const FieldSet = memo(function FieldSet({
	children,
	heading,
	isActive = false, // TODO: There is a CSS focus that replaces this behaviour. Remove when confirmed working.
	className,
	...divProps
}: FieldSetProps) {
	const componentClassName = useClassNameFactory('fieldSet')

	return (
		<div className={componentClassName('', [toStateClass('active', isActive), className])} {...divProps}>
			{heading !== undefined && (
				<div className={componentClassName('heading')} contentEditable={false}>
					<Heading size="small">
						{heading}
					</Heading>
				</div>
			)}
			{children !== undefined && (
				<Stack direction="vertical" className={componentClassName('content')}>
					{children}
				</Stack>
			)}
		</div>
	)
})
