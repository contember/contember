import type { EntityAccessor, EntityListAccessor } from '@contember/binding'
import { FieldContainer, Stack } from '@contember/ui'
import { memo, ReactNode } from 'react'
import type { MessageFormatter } from '../../../../i18n'
import { AccessorErrors } from '../../errors'
import { AddEntityButtonProps, CreateNewEntityButton, EmptyMessage, EmptyMessageOuterProps } from '../helpers'
import type { RepeaterDictionary } from './repeaterDictionary'

export type RepeaterFieldContainerPublicProps =
	& EmptyMessageOuterProps
	& AddEntityButtonProps
	& {
		enableAddingNew?: boolean
	}

export interface RepeaterFieldContainerPrivateProps {
	accessor: EntityListAccessor
	entities: EntityAccessor[]
	formatMessage: MessageFormatter<RepeaterDictionary>
	isEmpty: boolean
	boxLabel?: ReactNode
	label: ReactNode
	createNewEntity: (initialize?: EntityAccessor.BatchUpdatesHandler) => void
	children: ReactNode
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
	}: RepeaterFieldContainerProps) => {
		return <FieldContainer label={label} useLabelElement={false}>
			<Stack
				direction="vertical"
				gap="small"
			>
				<AccessorErrors accessor={accessor} />
				{isEmpty && (
					<EmptyMessage component={emptyMessageComponent}>{formatMessage(emptyMessage, 'repeater.emptyMessage.text')}</EmptyMessage>
				)}
				{isEmpty || children}
				{enableAddingNew && (
					<AddButton
						{...addButtonComponentExtraProps}
						{...addButtonProps}
						createNewEntity={createNewEntity}
					>
						{addButtonText ?? label ?? formatMessage('repeater.addButton.text')}
					</AddButton>
				)}
			</Stack>
		</FieldContainer>
	},
)
RepeaterFieldContainer.displayName = 'RepeaterFieldContainer'
