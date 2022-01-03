import { ComponentType, memo, ReactNode } from 'react'
import { Size } from 'types'
import { useClassNamePrefix } from '../../auxiliary'
import { BoxContent } from '../Box'
import { Icon } from '../Icon'
import { Stack } from '../Stack'
import { Label } from '../Typography/Label'

export interface RepeaterContainerProps {
	gap?: Size
	label?: ReactNode
	actions?: ReactNode
	children: ReactNode
	dragHandleComponent?: ComponentType<{ children: ReactNode }>
}

export const RepeaterContainer = memo(({ actions, children, gap, label, dragHandleComponent: Handle }: RepeaterContainerProps) => {
	const componentClassName = `${useClassNamePrefix()}repeater-container`

	return (
		<BoxContent gap={gap} className={componentClassName}>
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
		</BoxContent>
	)
})
RepeaterContainer.displayName = 'RepeaterContainer'
