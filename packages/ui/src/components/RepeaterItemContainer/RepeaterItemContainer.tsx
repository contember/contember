import { ComponentType, memo, ReactNode } from 'react'
import { Size } from 'types'
import { useClassNamePrefix } from '../../auxiliary'
import { Box } from '../Box'
import { Icon } from '../Icon'
import { Stack } from '../Stack'
import { Label } from '../Typography/Label'

export interface RepeaterItemContainerProps {
	gap?: Size
	label?: ReactNode
	actions?: ReactNode
	children: ReactNode
	dragHandleComponent?: ComponentType<{ children: ReactNode }>
}

export const RepeaterItemContainer = memo(({ actions, children, gap, label, dragHandleComponent: Handle }: RepeaterItemContainerProps) => {
	const componentClassName = `${useClassNamePrefix()}repeater-item-container`

	return (
		<Box gap={gap} className={componentClassName}>
			{Handle && (
				<div className={`${componentClassName}-handle`}>
					<Handle>
						<Icon blueprintIcon="drag-handle-vertical" />
					</Handle>
				</div>
			)}
			{(label || actions) && <div className={`${componentClassName}-header`}>
				{label && (
					<div className={`${componentClassName}-label`}>
						<Label>
							{label}
						</Label>
					</div>
				)}
				{actions && <div className={`${componentClassName}-actions`}>{actions}</div>}
			</div>}
			<Stack
				className={`${componentClassName}-content`}
				direction="vertical"
				gap={gap}
			>
				{children}
			</Stack>
		</Box>
	)
})
RepeaterItemContainer.displayName = 'RepeaterItemContainer'
