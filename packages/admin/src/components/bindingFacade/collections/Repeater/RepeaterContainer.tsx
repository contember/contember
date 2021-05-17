import { EntityAccessor, EntityListAccessor } from '@contember/binding'
import { Box, BoxSection, ErrorList } from '@contember/ui'
import { ComponentType, memo, ReactNode } from 'react'
import { MessageFormatter } from '../../../../i18n'
import { CreateNewEntityButton, CreateNewEntityButtonProps, EmptyMessage, EmptyMessageProps } from '../helpers'
import { RepeaterDictionary } from './repeaterDictionary'

export interface RepeaterContainerPrivateProps {
	accessor: EntityListAccessor
	entities: EntityAccessor[]
	isEmpty: boolean
	label: ReactNode
	createNewEntity: (initialize?: EntityAccessor.BatchUpdatesHandler) => void
	formatMessage: MessageFormatter<RepeaterDictionary>
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
		children,
		createNewEntity,
		addButtonComponent: AddButton = CreateNewEntityButton,
		addButtonComponentExtraProps,
		addButtonProps,
		addButtonText,
		emptyMessage,
		emptyMessageComponent: EmptyMessageComponent = EmptyMessage,
		emptyMessageComponentExtraProps,
		enableAddingNew = true,
		formatMessage,
		isEmpty,
		label,
	}: RepeaterContainerProps) => {
		return (
			<Box heading={label}>
				<ErrorList errors={accessor.errors} />
				{isEmpty && (
					<EmptyMessageComponent {...emptyMessageComponentExtraProps}>
						{formatMessage(emptyMessage, 'repeater.emptyMessage.text')}
					</EmptyMessageComponent>
				)}
				{isEmpty || children}
				{enableAddingNew && (
					<BoxSection heading={undefined}>
						<AddButton
							{...addButtonComponentExtraProps}
							children={formatMessage(addButtonText, 'repeater.addButton.text')}
							{...addButtonProps}
							createNewEntity={createNewEntity}
						/>
					</BoxSection>
				)}
			</Box>
		)
	},
)
RepeaterContainer.displayName = 'RepeaterContainer'
