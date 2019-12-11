import cn from 'classnames'
import * as React from 'react'
import { IncreaseHeadingDepth } from '../../auxiliary'
import { BoxDepthContext, HeadingDepthContext } from '../../contexts'
import { toViewClass } from '../../utils'
import { Heading } from '../Heading'
import { Icon } from '../Icon'

export interface BoxSectionProps {
	heading: React.ReactNode
	actions?: React.ReactNode
	children: React.ReactNode
	dragHandleComponent?: React.ComponentType<{ children: React.ReactNode }>
}

export const BoxSection = React.memo(({ actions, children, heading, dragHandleComponent: Handle }: BoxSectionProps) => {
	const boxDepth = React.useContext(BoxDepthContext)
	const headingDepth = React.useContext(HeadingDepthContext)

	return (
		<div className={cn('box-section', toViewClass(`depth-${Math.max(boxDepth - 1, 1)}`, true))}>
			{Handle && (
				<div className="box-section-handle">
					<Handle>
						<Icon blueprintIcon="drag-handle-vertical" />
					</Handle>
				</div>
			)}
			{heading && (
				<div className="box-section-heading">
					<Heading depth={headingDepth} size="small">
						{heading}
					</Heading>
				</div>
			)}
			{actions && <div className="box-section-actions">{actions}</div>}
			<div className="box-section-content">
				<IncreaseHeadingDepth currentDepth={headingDepth}>{children}</IncreaseHeadingDepth>
			</div>
		</div>
	)
})
BoxSection.displayName = 'BoxSection'
