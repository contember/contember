import cn from 'classnames'
import { forwardRef, memo, ReactNode, useContext } from 'react'
import { IncreaseBoxDepth, IncreaseHeadingDepth, useClassNamePrefix } from '../../auxiliary'
import { BoxDepthContext, HeadingDepthContext } from '../../contexts'
import { BoxDistinction, NativeProps } from '../../types'
import { toEnumViewClass, toStateClass, toViewClass } from '../../utils'
import { Heading } from '../Heading'

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
			const boxDepth = useContext(BoxDepthContext)
			const headingDepth = useContext(HeadingDepthContext)
			const prefix = useClassNamePrefix()

			return (
				<div
					{...divProps}
					className={cn(
						`${prefix}box`,
						toViewClass(`depth-${boxDepth}`, true),
						toEnumViewClass(distinction),
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
						<div className={`${prefix}box-content`}>
							<IncreaseHeadingDepth currentDepth={headingDepth} onlyIf={!!heading}>
								<IncreaseBoxDepth currentDepth={boxDepth} onlyIf={distinction !== 'seamlessIfNested'}>
									{children}
								</IncreaseBoxDepth>
							</IncreaseHeadingDepth>
						</div>
					)}
				</div>
			)
		},
	),
)
Box.displayName = 'Box'
