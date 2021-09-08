import classnames from 'classnames'
import { forwardRef, memo, ReactNode, useContext } from 'react'
import { IncreaseBoxDepth, useClassNamePrefix } from '../../auxiliary'
import { BoxDepthContext } from '../../contexts'
import type { BoxDepth, BoxDistinction, NativeProps } from '../../types'
import { toEnumViewClass, toViewClass } from '../../utils'
import { Stack } from '../Stack'

export interface BoxContentOwnProps {
	depth?: BoxDepth
	distinction?: BoxDistinction
	children?: ReactNode
}

export interface BoxContentProps extends BoxContentOwnProps, Omit<NativeProps<HTMLDivElement>, 'children'> {}

export const BoxContent = memo(
	forwardRef<HTMLDivElement, BoxContentProps>(
		({ children, className, depth, distinction, ...rest }: BoxContentProps, ref) => {
			const boxDepth = useContext(BoxDepthContext)
			const prefix = useClassNamePrefix()

			const currentDepth = Math.min(6, depth ?? boxDepth) as BoxDepth

			return <>
				{children && <div
					{...rest}
					className={classnames(
						`${prefix}box-content`,
						toViewClass(`depth-${currentDepth}`, true),
						toEnumViewClass(distinction),
						className,
					)}
					ref={ref}
				>
					<Stack
						direction="vertical"
						depth={Math.max(3, currentDepth) as BoxDepth}
					>
						<IncreaseBoxDepth currentDepth={currentDepth} onlyIf={distinction !== 'seamlessIfNested'}>
							{children}
						</IncreaseBoxDepth>
					</Stack>
				</div>}
			</>
		},
	),
)
BoxContent.displayName = 'BoxContent'
