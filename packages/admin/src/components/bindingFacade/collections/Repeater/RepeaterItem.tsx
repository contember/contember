import { BindingError, RemovalType } from '@contember/binding'
import { RepeaterItemContainer, RepeaterItemContainerProps } from '@contember/ui'
import { memo, ReactNode } from 'react'
import { DeleteEntityButton } from '../helpers'
import { RepeaterCreateNewEntity } from './RepeaterFieldContainer'

export interface RepeaterItemProps {
	label: ReactNode
	children: ReactNode
	canBeRemoved: boolean
	index: number
	createNewEntity: RepeaterCreateNewEntity
	dragHandleComponent?: RepeaterItemContainerProps['dragHandleComponent']
	removalType: RemovalType
}

export const RepeaterItem = memo(
	({ children, canBeRemoved, label, removalType, dragHandleComponent, index }: RepeaterItemProps) => {
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
				actions={canBeRemoved ? <DeleteEntityButton /> : undefined}
			>
				{children}
			</RepeaterItemContainer>
		)
	},
)
RepeaterItem.displayName = 'RepeaterItem'
