import type { EntityAccessor, EntityListAccessor } from '@contember/binding'
import { FormGroup, Stack } from '@contember/ui'
import { ComponentType, memo, ReactNode } from 'react'
import type { MessageFormatter } from '../../../../i18n'
import { AccessorErrors } from '../../errors'
import { CreateNewEntityButton, CreateNewEntityButtonProps, EmptyMessage, EmptyMessageProps } from '../helpers'
import type { RepeaterDictionary } from './repeaterDictionary'

export interface RepeaterContainerPrivateProps {
	accessor: EntityListAccessor
	entities: EntityAccessor[]
	formatMessage: MessageFormatter<RepeaterDictionary>
	isEmpty: boolean
	boxLabel?: ReactNode
	label: ReactNode
	createNewEntity: (initialize?: EntityAccessor.BatchUpdatesHandler) => void
	children: ReactNode
}
export interface RepeaterContainerPublicProps {
	enableAddingNew?: boolean

	emptyMessage?: ReactNode
	emptyMessageComponent?: ComponentType<EmptyMessageProps & any> // This can override 'emptyMessage'
	emptyMessageComponentExtraProps?: {}

	addButtonText?: ReactNode
	addButtonProps?: CreateNewEntityButtonProps // Children here override 'addButtonText'
	addButtonComponent?: ComponentType<CreateNewEntityButtonProps & any> // This can override 'addButtonText' and 'addButtonProps'
	addButtonComponentExtraProps?: {}
}

export interface RepeaterContainerProps extends RepeaterContainerPublicProps, RepeaterContainerPrivateProps {}

export const RepeaterContainer = memo(
	({
		accessor,
		addButtonText,
		children,
		createNewEntity,
		addButtonComponent: AddButton = CreateNewEntityButton,
		addButtonComponentExtraProps,
		addButtonProps,
		emptyMessageComponent: EmptyMessageComponent = EmptyMessage,
		enableAddingNew = true,
		formatMessage,
		isEmpty,
		label,
	}: RepeaterContainerProps) => {
		return <FormGroup label={label} useLabelElement={false}>
			<Stack
				direction="vertical"
				depth={5}
			>
				<AccessorErrors accessor={accessor} />
				{isEmpty && (
					<AddButton
						{...addButtonComponentExtraProps}
						{...addButtonProps}
						createNewEntity={createNewEntity}
					>
						{addButtonText ?? label ?? formatMessage(addButtonText, 'repeater.addButton.text')}
					</AddButton>
				)}
				{isEmpty || children}
				{!isEmpty && enableAddingNew && (
					<AddButton
						{...addButtonComponentExtraProps}
						{...addButtonProps}
						createNewEntity={createNewEntity}
					>
						{addButtonText ?? label ?? formatMessage(addButtonText, 'repeater.addButton.text')}
					</AddButton>
				)}
			</Stack>
		</FormGroup>
	},
)
RepeaterContainer.displayName = 'RepeaterContainer'
