import { useClassNameFactory } from '@contember/react-utils'
import { dataAttribute, isNumber } from '@contember/utilities'
import { ComponentType, ReactNode, memo } from 'react'
import { Box, BoxProps } from '../Box'
import { Icon } from '../Icon'
import { Label } from '../Typography/Label'

export type RepeaterItemContainerOwnProps = {
	index?: number
	children: ReactNode
	dragHandleComponent?: ComponentType<{ children: ReactNode }>
}

export type RepeaterItemContainerProps =
	& Omit<BoxProps, 'header' | 'footer' | 'heading' | keyof RepeaterItemContainerOwnProps>
	& RepeaterItemContainerOwnProps

const repeaterItemContainerClassNameBase = 'repeater-item-container'

export const RepeaterItemContainer = memo(({ actions, gap, children, label, dragHandleComponent: Handle, index, ...rest }: RepeaterItemContainerProps) => {
	const componentClassName = useClassNameFactory(repeaterItemContainerClassNameBase)

	return (
		<Box
			{...rest}
			className={componentClassName()}
			gap={gap ?? 'gutter'}
			data-sortable={dataAttribute(!!Handle)}
			header={isNumber(index) || label || actions
				? (<RepeaterItemContainerHeader index={index} label={label} actions={actions} />)
				: null
			}
		>
			{Handle && (
				<div className={componentClassName('handle')}>
					<Handle>
						<Icon blueprintIcon="drag-handle-vertical" />
					</Handle>
				</div>
			)}
			{children}
		</Box>
	)
})
RepeaterItemContainer.displayName = 'RepeaterItemContainer'


export type RepeaterItemContainerHeaderProps = {
	index?: number
	label?: ReactNode
	actions?: ReactNode
}

export const RepeaterItemContainerHeader = memo(({ label, actions, index }: RepeaterItemContainerHeaderProps) => {
	const componentClassName = useClassNameFactory(repeaterItemContainerClassNameBase)

	return (
		<>
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
		</>
	)
})
