import { Button, ButtonProps, DeleteEntityButton, Dropdown, DropdownProps, EntityId, RepeaterItemContainer, RepeaterItemProps, Spacer, Text, useEntity } from '@contember/admin'
import { ChevronRightIcon, MoreVerticalIcon } from 'lucide-react'
import { MouseEventHandler, forwardRef, memo, useCallback } from 'react'

export interface MessageListItemOwnProps {
	selectedId?: EntityId | null
	onClick?: (id: EntityId, event?: Parameters<Exclude<ButtonProps['onClick'], undefined>>[0]) => void
}

export interface ChatsListItemProps extends Omit<RepeaterItemProps, keyof MessageListItemOwnProps>, MessageListItemOwnProps {
}

export const ChatsListItem = memo(forwardRef<HTMLDivElement, ChatsListItemProps>(({
	createNewEntity,
	dragHandleComponent,
	index,
	label,
	removalType,
	canBeRemoved,
	children,
	onClick: onClickProp,
	onKeyPress: onKeyPressProp,
	selectedId,
	className,
	...rest
}, forwardedRef) => {
	const entity = useEntity()
	const id = entity.id
	const name = entity.getField<string>('createdBy.name').value

	const onClick: MouseEventHandler<HTMLButtonElement> = useCallback(event => {
		onClickProp?.(entity.id, event)
	}, [entity.id, onClickProp])

	return (
		<RepeaterItemContainer
			ref={forwardedRef}
			{...rest}
			label={(
				<>
					<Button
						inset={false}
						justify="space-between"
						display="block"
						distinction="seamless"
						active={selectedId === id}
						style={{ flexGrow: 1 }}
						onClick={onClick}
					>
						{name ?? 'New message...'}
						<Spacer grow />
						{selectedId === id ? <Text>Close</Text> : <ChevronRightIcon />}
					</Button>
					{canBeRemoved && (
						<Dropdown buttonProps={dropdownButtonProps}>
							<DeleteEntityButton inset={false} />
						</Dropdown>
					)}
				</>
			)}
			padding="double"
		>
			{selectedId === id ? children : null}
		</RepeaterItemContainer>
	)
}))

const dropdownButtonProps: DropdownProps['buttonProps'] = {
	distinction: 'seamless',
	children: <MoreVerticalIcon />,
	className: 'chat-list-more-button',
	padding: 'gap',
}
