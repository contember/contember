import { useClassNameFactory } from '@contember/utilities'
import { ComponentType, memo, ReactNode } from 'react'
import { Size } from '../../types'
import { toViewClass } from '../../utils'
import { Box } from '../Box'
import { Icon } from '../Icon'
import { Stack } from '../Stack'
import { Label } from '../Typography/Label'

export interface RepeaterItemContainerProps {
	gap?: Size
	label?: ReactNode
	index?: number
	actions?: ReactNode
	children: ReactNode
	dragHandleComponent?: ComponentType<{ children: ReactNode }>
}

const repeaterItemContainerClassNameBase = 'repeater-item-container'

export const RepeaterItemContainer = memo(({ actions, children, gap, label, dragHandleComponent: Handle, index }: RepeaterItemContainerProps) => {
	const componentClassName = useClassNameFactory(repeaterItemContainerClassNameBase)

	return (
		<Box
			gap={gap}
			className={componentClassName(null, toViewClass('sortable', !!Handle))}
		>
			{Handle && (
				<div className={componentClassName('handle')}>
					<Handle>
						<Icon blueprintIcon="drag-handle-vertical" />
					</Handle>
				</div>
			)}
			<RepeaterItemContainerHeader index={index} label={label} actions={actions} />
			<Stack
				className={componentClassName('content')}
				direction="vertical"
				gap={gap}
			>
				{children}
			</Stack>
		</Box>
	)
})
RepeaterItemContainer.displayName = 'RepeaterItemContainer'


export type RepeaterItemContainerHeaderProps = Pick<RepeaterItemContainerProps, 'index' | 'label' | 'actions'>

export const RepeaterItemContainerHeader = memo(({ label, actions, index }: RepeaterItemContainerHeaderProps) => {
	const componentClassName = useClassNameFactory(repeaterItemContainerClassNameBase)

	if (!label && !actions && index === undefined) {
		return null
	}

	return (
		<div className={componentClassName('header')}>
			{(label || index !== undefined) && (
				<div className={componentClassName('label')}>
					<Label>
						{label}{label ? ' ' : ''}
						{index !== undefined && (
							<span className={componentClassName('index')}>{index + 1}</span>
						)}
					</Label>
				</div>
			)}
			{actions && (
				<div className={componentClassName('actions')}>{actions}</div>
			)}
		</div>
	)
})
