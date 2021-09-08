import cn from 'classnames'
import { ComponentType, memo, ReactNode, useContext } from 'react'
import { BoxDepth } from 'types'
import { IncreaseHeadingDepth, useClassNamePrefix } from '../../auxiliary'
import { BoxDepthContext, HeadingDepthContext } from '../../contexts'
import { toViewClass } from '../../utils'
import { Heading } from '../Heading'
import { Icon } from '../Icon'
import { Stack } from '../Stack'

export interface BoxSectionProps {
	heading?: ReactNode
	actions?: ReactNode
	children: ReactNode
	dragHandleComponent?: ComponentType<{ children: ReactNode }>
}

export const BoxSection = memo(({ actions, children, heading, dragHandleComponent: Handle }: BoxSectionProps) => {
	const boxDepth = useContext(BoxDepthContext) + 1
	const headingDepth = useContext(HeadingDepthContext)
	const prefix = useClassNamePrefix()

	return (
		<div
			className={cn(
				`${prefix}box-section`,
				toViewClass(`depth-${Math.max(boxDepth - 1, 2)}`, true),
				toViewClass('hasHeading', !!heading),
				toViewClass('hasActions', !!actions),
			)}
		>
			{Handle && (
				<div className={`${prefix}box-section-handle`}>
					<Handle>
						<Icon blueprintIcon="drag-handle-vertical" />
					</Handle>
				</div>
			)}
			{heading && (
				<div className={`${prefix}box-section-heading`}>
					<Heading depth={6} size="small">
						{heading}
					</Heading>
				</div>
			)}
			{actions && <div className={`${prefix}box-section-actions`}>{actions}</div>}
			<Stack
				direction="vertical"
				depth={Math.max(3, boxDepth) as BoxDepth}
				className={`${prefix}box-section-content`}
			>
				<IncreaseHeadingDepth currentDepth={headingDepth}>{children}</IncreaseHeadingDepth>
			</Stack>
		</div>
	)
})
BoxSection.displayName = 'BoxSection'
