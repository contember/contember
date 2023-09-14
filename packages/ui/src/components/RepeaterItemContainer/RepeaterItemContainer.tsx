import { useClassNameFactory } from '@contember/react-utils'
import { dataAttribute, isNumber } from '@contember/utilities'
import { GripVerticalIcon } from 'lucide-react'
import { ComponentType, ReactNode, forwardRef, memo } from 'react'
import { Box, BoxProps } from '../Box'
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

export const RepeaterItemContainer = memo(forwardRef<HTMLDivElement, RepeaterItemContainerProps>(({ actions, gap, children, label, dragHandleComponent: Handle, index, className: classNameProp, componentClassName = repeaterItemContainerClassNameBase, ...rest }, forwardedRef) => {
	const className = useClassNameFactory(componentClassName)

	return (
		<Box
			ref={forwardedRef}
			{...rest}
			className={className(null, classNameProp)}
			gap={gap ?? 'gutter'}
			data-index={dataAttribute(index)}
			data-sortable={dataAttribute(!!Handle)}
			header={isNumber(index) || label || actions
				? (<RepeaterItemContainerHeader index={index} label={label} actions={actions} />)
				: null
			}
		>
			{Handle && (
				<div className={className('handle')}>
					<Handle>
						<GripVerticalIcon />
					</Handle>
				</div>
			)}
			{children}
		</Box>
	)
}))
RepeaterItemContainer.displayName = 'RepeaterItemContainer'


export type RepeaterItemContainerHeaderProps = {
	index?: number
	label?: ReactNode
	actions?: ReactNode
}

export const RepeaterItemContainerHeader = memo(({ label, actions, index }: RepeaterItemContainerHeaderProps) => {
	const className = useClassNameFactory(repeaterItemContainerClassNameBase)

	return (
		<>
			{(typeof label === 'string' || typeof label === 'number' || typeof label === 'boolean' || label == null)
				? (label || index !== undefined) && (
					<Label className={className('label')}>
						{label}{label ? ' ' : ''}
						{index !== undefined && (
							<span className={className('index')}>{index + 1}</span>
						)}
					</Label>
				)
				: label
			}

			{actions && (
				<div className={className('actions')}>{actions}</div>
			)}
		</>
	)
})
