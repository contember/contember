import cn from 'classnames'
import { ComponentType, memo, ReactNode } from 'react'
import { Size } from 'types'
import { useClassNamePrefix } from '../../auxiliary'
import { toViewClass } from '../../utils'
import { Icon } from '../Icon'
import { Stack } from '../Stack'
import { Label } from '../Typography/Label'

export interface BoxSectionProps {
	gap?: Size
	heading?: ReactNode
	actions?: ReactNode
	children: ReactNode
	dragHandleComponent?: ComponentType<{ children: ReactNode }>
}

export const BoxSection = memo(({ actions, children, gap, heading, dragHandleComponent: Handle }: BoxSectionProps) => {
	const prefix = useClassNamePrefix()

	return (
		<div
			className={cn(
				`${prefix}box-section`,
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
					<Label>
						{heading}
					</Label>
				</div>
			)}
			{actions && <div className={`${prefix}box-section-actions`}>{actions}</div>}
			<Stack
				className={`${prefix}box-section-content`}
				direction="vertical"
				gap={gap}
			>
				{children}
			</Stack>
		</div>
	)
})
BoxSection.displayName = 'BoxSection'
