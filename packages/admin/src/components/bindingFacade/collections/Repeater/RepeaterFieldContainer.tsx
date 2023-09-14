import type { EntityAccessor, EntityListAccessor } from '@contember/react-binding'
import {
	AccessorErrors,
	AddEntityButtonProps,
	CreateNewEntityButton,
	EmptyMessage,
	EmptyMessageOuterProps,
} from '@contember/react-binding-ui'
import type { MessageFormatter } from '@contember/react-i18n'
import { FieldContainer, FieldContainerOwnProps } from '@contember/ui'
import { memo } from 'react'
import type { RepeaterDictionary } from './repeaterDictionary'

export type RepeaterFieldContainerPublicProps =
	& EmptyMessageOuterProps
	& AddEntityButtonProps
	& {
		enableAddingNew?: boolean
	}

export type RepeaterCreateNewEntity = (initialize?: EntityAccessor.BatchUpdatesHandler, index?: number) => void

export interface RepeaterFieldContainerPrivateProps extends Omit<FieldContainerOwnProps, 'useLabelElement'> {
	accessor: EntityListAccessor
	entities: EntityAccessor[]
	formatMessage: MessageFormatter<RepeaterDictionary>
	isEmpty: boolean
	createNewEntity: RepeaterCreateNewEntity
}

export type RepeaterFieldContainerProps =
	& RepeaterFieldContainerPublicProps
	& RepeaterFieldContainerPrivateProps

export const RepeaterFieldContainer = memo(
	({
		accessor,
		addButtonText,
		children,
		createNewEntity,
		addButtonComponent: AddButton = CreateNewEntityButton,
		addButtonComponentExtraProps,
		addButtonProps,
		emptyMessage,
		emptyMessageComponent,
		enableAddingNew = true,
		formatMessage,
		isEmpty,
		label,
		...rest
	}: RepeaterFieldContainerProps) => {
		return (
			<FieldContainer
				label={label}
				{...rest}
				useLabelElement={false}
				footer={enableAddingNew && (
					<AddButton
						{...addButtonComponentExtraProps}
						{...addButtonProps}
						createNewEntity={createNewEntity}
					>
						{addButtonText ?? label ?? formatMessage('repeater.addButton.text')}
					</AddButton>
				)}
			>
				<AccessorErrors accessor={accessor} />
				{isEmpty && (
					<EmptyMessage component={emptyMessageComponent}>{formatMessage(emptyMessage, 'repeater.emptyMessage.text')}</EmptyMessage>
				)}
				{isEmpty || children}
			</FieldContainer>
		)
	},
)
RepeaterFieldContainer.displayName = 'RepeaterFieldContainer'
