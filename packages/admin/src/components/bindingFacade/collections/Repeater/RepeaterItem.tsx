import { BindingError, RemovalType } from '@contember/react-binding'
import { DeleteEntityButton } from '@contember/react-binding-ui'
import { RepeaterItemContainer, RepeaterItemContainerProps } from '@contember/ui'
import { ReactNode, forwardRef, memo } from 'react'
import { RepeaterCreateNewEntity } from './RepeaterFieldContainer'

export type RepeaterItemOwnProps = {
	canBeRemoved?: boolean
	children: ReactNode
	createNewEntity: RepeaterCreateNewEntity
	dragHandleComponent?: RepeaterItemContainerProps['dragHandleComponent']
	index: number
	label: ReactNode
	removalType: RemovalType
}

export interface RepeaterItemProps extends Omit<RepeaterItemContainerProps, keyof RepeaterItemOwnProps>, RepeaterItemOwnProps { }

export const RepeaterItem = memo(forwardRef<HTMLDivElement, RepeaterItemProps>(({
	canBeRemoved,
	children,
	createNewEntity: _INTENTIONALLY_OMITTED_createNewEntity,
	dragHandleComponent,
	index,
	label,
	removalType,
	...rest
}, forwardedRef) => {
	if (removalType !== 'delete') {
		throw new BindingError(
			`As a temporary limitation, <Repeater /> can currently only delete its items, not disconnect them. ` +
			`This restriction is planned to be lifted sometime in future.`,
		)
	}

	return (
		<RepeaterItemContainer
			ref={forwardedRef}
			dragHandleComponent={dragHandleComponent}
			label={label}
			index={index}
			actions={canBeRemoved && <DeleteEntityButton />}
			{...rest}
		>
			{children}
		</RepeaterItemContainer>
	)
}))
RepeaterItem.displayName = 'RepeaterItem'
