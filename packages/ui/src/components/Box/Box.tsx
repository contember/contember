import classnames from 'classnames'
import { forwardRef, memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import type { BoxDistinction, NativeProps } from '../../types'
import { toStateClass } from '../../utils'
import { Label } from '../Typography/Label'
import { BoxContent } from './BoxContent'

export interface BoxOwnProps {
	heading?: ReactNode
	actions?: ReactNode
	children?: ReactNode
	distinction?: BoxDistinction
	isActive?: boolean
}

export interface BoxProps extends BoxOwnProps, Omit<NativeProps<HTMLDivElement>, 'children'> {}

export const Box = memo(
	forwardRef<HTMLDivElement, BoxProps>(
		({ actions, children, heading, distinction, isActive = false, className, ...divProps }: BoxProps, ref) => {
			const prefix = useClassNamePrefix()

			return (
				<div
					{...divProps}
					className={classnames(
						`${prefix}box`,
						toStateClass('active', isActive),
						className,
					)}
					ref={ref}
				>
					{heading && (
						<div className={`${prefix}box-heading`} contentEditable={false}>
							<Label>{heading}</Label>
						</div>
					)}
					{actions && (
						<div className={`${prefix}box-actions`} contentEditable={false}>
							{actions}
						</div>
					)}
					{children && (
						<BoxContent distinction={distinction}>{children}</BoxContent>
					)}
				</div>
			)
		},
	),
)
Box.displayName = 'Box'
