import classnames from 'classnames'
import { forwardRef, memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import type { BoxDistinction, Default, Intent, NativeProps, Size } from '../../types'
import { toEnumViewClass, toStateClass, toThemeClass } from '../../utils'
import { Stack } from '../Stack'
import { Label } from '../Typography/Label'

export interface BoxOwnProps {
	actions?: ReactNode
	children?: ReactNode
	distinction?: BoxDistinction
	gap?: Size | 'none'
	heading?: ReactNode
	isActive?: boolean
	intent?: Intent
	padding?: Default | 'no-padding'
}

export interface BoxProps extends BoxOwnProps, Omit<NativeProps<HTMLDivElement>, 'children'> {}

export const Box = memo(
	forwardRef<HTMLDivElement, BoxProps>(
		({ actions, className, distinction, children, gap, heading, intent, isActive, padding, ...divProps }: BoxProps, ref) => {
			const componentClassName = `${useClassNamePrefix()}box`

			return (
				<div
					{...divProps}
					className={classnames(
						componentClassName,
						toStateClass('active', isActive),
						toEnumViewClass(distinction),
						toThemeClass(intent),
						toEnumViewClass(padding),
						className,
					)}
					ref={ref}
				>
					<Stack gap={gap ?? 'small'} direction="vertical">
						{(heading || actions) && (
							<div className={`${componentClassName}-header`}>
								{heading && <Label>{heading}</Label>}
								{actions && (
									<div className={`${componentClassName}-actions`} contentEditable={false}>
										{actions}
									</div>
								)}
							</div>
						)}
						{children}
					</Stack>
				</div>
			)
		},
	),
)
Box.displayName = 'Box'
