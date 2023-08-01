import { BindingError, RemovalType } from '@contember/binding'
import { RepeaterItemContainer, RepeaterItemContainerProps } from '@contember/ui'
import { ReactNode, memo } from 'react'
import { DeleteEntityButton } from '../helpers'

export type RepeaterItemOwnProps = {
	label: ReactNode
	children: ReactNode
	canBeRemoved?: boolean
	index: number
	dragHandleComponent?: RepeaterItemContainerProps['dragHandleComponent']
	removalType: RemovalType
}

export interface RepeaterItemProps extends Omit<RepeaterItemContainerProps, keyof RepeaterItemOwnProps>, RepeaterItemOwnProps { }

export const RepeaterItem = memo(
	({ children, canBeRemoved, label, removalType, dragHandleComponent, index, ...rest }: RepeaterItemProps) => {
		if (removalType !== 'delete') {
			throw new BindingError(
				`As a temporary limitation, <Repeater /> can currently only delete its items, not disconnect them. ` +
				`This restriction is planned to be lifted sometime in future.`,
			)
		}

		return (
			<RepeaterItemContainer
				dragHandleComponent={dragHandleComponent}
				label={label}
				index={index}
				actions={canBeRemoved && <DeleteEntityButton />}
				{...rest}
			>
				{children}
			</RepeaterItemContainer>
		)
	},
)
RepeaterItem.displayName = 'RepeaterItem'
