import { Box, BoxSection } from '@contember/ui'
import * as React from 'react'
import { EntityListAccessor } from '../../../../binding'
import { AddNewEntityButton, AddNewEntityButtonProps, EmptyMessage, EmptyMessageProps } from '../helpers'

export interface RepeaterContainerProps {
	isEmpty: boolean
	label: React.ReactNode
	addNew: (preprocess?: (getAccessor: () => EntityListAccessor, newIndex: number) => void) => void

	children: React.ReactNode

	enableAddingNew?: boolean

	emptyMessage?: React.ReactNode
	emptyMessageComponent?: React.ComponentType<EmptyMessageProps> // This can override 'emptyMessage'

	addButtonText?: React.ReactNode
	addButtonProps?: AddNewEntityButtonProps // Children here override 'addButtonText'
	addButtonComponent?: React.ComponentType<AddNewEntityButtonProps> // This can override 'addButtonText' and 'addButtonProps'
}

export const RepeaterContainer = React.memo(
	({
		addNew,
		children,
		addButtonComponent: AddButton = AddNewEntityButton,
		addButtonProps,
		addButtonText = 'Add',
		emptyMessage = 'There is nothing here. Try adding a new item.',
		emptyMessageComponent: EmptyMessageComponent = EmptyMessage,
		enableAddingNew = true,
		isEmpty,
		label,
	}: RepeaterContainerProps) => {
		if (isEmpty) {
			return (
				<Box heading={label}>
					<EmptyMessageComponent>{emptyMessage}</EmptyMessageComponent>
				</Box>
			)
		}

		return (
			<Box heading={label}>
				{children}
				{enableAddingNew && (
					<BoxSection heading={undefined}>
						<AddButton children={addButtonText} {...addButtonProps} addNew={addNew} />
					</BoxSection>
				)}
			</Box>
		)
	},
)
RepeaterContainer.displayName = 'RepeaterContainer'
