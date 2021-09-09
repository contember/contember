import classnames from 'classnames'
import { forwardRef, memo, ReactNode, useContext } from 'react'
import { IncreaseHeadingDepth, useClassNamePrefix } from '../../auxiliary'
import { BoxDepthContext, HeadingDepthContext } from '../../contexts'
import type { BoxDistinction, BoxWidth, NativeProps } from '../../types'
import { toEnumViewClass, toStateClass, toViewClass } from '../../utils'
import { Heading } from '../Heading'
import { BoxContent } from './BoxContent'

export interface BoxOwnProps {
	heading?: ReactNode
	actions?: ReactNode
	children?: ReactNode
	distinction?: BoxDistinction
	isActive?: boolean
	width?: BoxWidth
}

export interface BoxProps extends BoxOwnProps, Omit<NativeProps<HTMLDivElement>, 'children'> {}

export const Box = memo(
	forwardRef<HTMLDivElement, BoxProps>(
		({ actions, children, heading, distinction, isActive = false, className, width, ...divProps }: BoxProps, ref) => {
			const boxDepth = useContext(BoxDepthContext)
			const headingDepth = useContext(HeadingDepthContext)
			const prefix = useClassNamePrefix()

			return (
				<div
					{...divProps}
					className={classnames(
						`${prefix}box`,
						toViewClass(`depth-${boxDepth}`, true),
						toEnumViewClass(width),
						toStateClass('active', isActive),
						className,
					)}
					ref={ref}
				>
					{heading && (
						<div className={`${prefix}box-heading`} contentEditable={false}>
							<Heading depth={headingDepth} size="small">
								{heading}
							</Heading>
						</div>
					)}
					{actions && (
						<div className={`${prefix}box-actions`} contentEditable={false}>
							{actions}
						</div>
					)}
					{children && (
						<IncreaseHeadingDepth currentDepth={headingDepth} onlyIf={!!heading}>
							<BoxContent distinction={distinction}>{children}</BoxContent>
						</IncreaseHeadingDepth>
					)}
				</div>
			)
		},
	),
)
Box.displayName = 'Box'
