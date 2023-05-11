import cn from 'classnames'
import { memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../../auxiliary'
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
	const prefix = useClassNamePrefix()

	return (
		<div className={cn(`${prefix}fieldSet`, toStateClass('active', isActive), className)} {...divProps}>
			{heading !== undefined && (
				<div className={`${prefix}fieldSet-heading`} contentEditable={false}>
					<Heading size="small">
						{heading}
					</Heading>
				</div>
			)}
			{children !== undefined && (
				<Stack direction="vertical" className={`${prefix}fieldSet-content`}>
					{children}
				</Stack>
			)}
		</div>
	)
})
