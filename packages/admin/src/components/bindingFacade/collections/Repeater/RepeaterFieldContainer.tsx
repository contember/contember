import type { EntityAccessor, EntityListAccessor } from '@contember/react-binding'
import { FieldContainer, FieldContainerOwnProps } from '@contember/ui'
import { deprecate, fallback, isDefined } from '@contember/utilities'
import { ReactNode, memo } from 'react'
import type { MessageFormatter } from '@contember/react-i18n'
import {
	AccessorErrors,
	AddEntityButtonProps,
	CreateNewEntityButton,
	EmptyMessage,
	EmptyMessageOuterProps,
} from '@contember/react-binding-ui'
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
	/**
	 * @deprecated Use label instead
	 */
	boxLabel?: ReactNode
	createNewEntity: RepeaterCreateNewEntity
}

export type RepeaterFieldContainerProps =
	& RepeaterFieldContainerPublicProps
	& RepeaterFieldContainerPrivateProps

export const RepeaterFieldContainer = memo(
	({
		accessor,
		addButtonText,
		boxLabel,
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
		deprecate('1.3.0', isDefined(boxLabel), '`boxLabel` prop', '`label` prop')
		label = fallback(label, isDefined(boxLabel), boxLabel)

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
