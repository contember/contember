import classNames from 'classnames'
import { ComponentType, memo, ReactNode } from 'react'
import { Size } from 'types'
import { useClassNamePrefix } from '../../auxiliary'
import { toViewClass } from '../../utils'
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
	const prefix = useClassNamePrefix()

	return (
		<BoxContent>
			<div
				className={classNames(
					`${prefix}repeater-container`,
					toViewClass('has-label', !!label),
					toViewClass('has-actions', !!actions),
				)}
			>
				{Handle && (
					<div className={`${prefix}repeater-container-handle`}>
						<Handle>
							<Icon blueprintIcon="drag-handle-vertical" />
						</Handle>
					</div>
				)}
				{label && (
					<div className={`${prefix}repeater-container-label`}>
						<Label>
							{label}
						</Label>
					</div>
				)}
				{actions && <div className={`${prefix}repeater-container-actions`}>{actions}</div>}
				<Stack
					className={`${prefix}repeater-container-content`}
					direction="vertical"
					gap={gap}
				>
					{children}
				</Stack>
			</div>
		</BoxContent>
	)
})
RepeaterContainer.displayName = 'RepeaterContainer'
