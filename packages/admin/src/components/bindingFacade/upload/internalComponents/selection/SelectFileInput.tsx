import { AccessorTree, Component, EntityAccessor, EntityId, useAccessorTreeState } from '@contember/binding'
import { Button, DropdownContentContainerProvider, useDialog } from '@contember/ui'
import { ComponentType, MouseEventHandler, ReactNode, useCallback } from 'react'
import { MessageFormatter } from '../../../../../i18n'
import { SelectEntityButtonProps } from '../../../collections'
import type { UploadDictionary } from '../../uploadDictionary'
import { ResolvedFileSelectionComponent, SelectFileDialog } from './SelectFileDialog'
import { EntityConnector } from '../hooks/useConnectSelectedEntities'

export interface FileSelectionProps {
	onToggleSelect: (connector: EntityAccessor) => void
	selectedEntityIds: EntityId[]
}

export interface SelectFileInputSelectionComponentProps<SFExtraProps extends {}> {
	fileSelectionComponent?: ComponentType<SFExtraProps & FileSelectionProps>
	fileSelectionProps?: SFExtraProps
	fileSelectionLabel?: ReactNode
}

export type SelectFileInputPublicProps =
	& SelectEntityButtonProps
	& {
		insertSelectedText?: string
	}

export type SelectFileInputProps<SFExtraProps extends {}> =
	& Partial<SelectFileInputPublicProps>
	& {
		formatMessage: MessageFormatter<UploadDictionary>
		onSelectConfirm: (selectedEntities: EntityConnector[]) => void
		isMultiple: boolean
		fileSelection?: ResolvedFileSelectionComponent<SFExtraProps>
	}

export const SelectFileInput = Component(
	({
		 formatMessage,
		 insertSelectedText,
		 onSelectConfirm,
		 selectButtonComponent: SelectButton = Button,
		 selectButtonComponentExtraProps,
		 selectButtonProps,
		 selectButtonText: selectButtonTextProp,
		 isMultiple,
		 fileSelection,
	 }: SelectFileInputProps<any>) => {
		const { openDialog } = useDialog<EntityConnector[]>()
		const selectButtonText = formatMessage(selectButtonTextProp, 'upload.selectButton.text')

		const accessorTree = useAccessorTreeState()

		const onClick = useCallback<MouseEventHandler<HTMLButtonElement>>(async event => {
			event.stopPropagation()

			const selectedEntities = await openDialog({
				type: 'captivating',
				bare: true,
				content: props => (
					<DropdownContentContainerProvider>
						<AccessorTree state={accessorTree}>
							<SelectFileDialog
								formatMessage={formatMessage}
								onCancel={() => props.resolve()}
								onSelect={props.resolve}
								insertSelectedText={insertSelectedText}
								selectButtonText={selectButtonText}
								isMultiple={isMultiple}
								{...fileSelection!}
							/>
						</AccessorTree>
					</DropdownContentContainerProvider>
				),
			})
			if (selectedEntities !== undefined) {
				onSelectConfirm(selectedEntities)
			}
		}, [accessorTree, fileSelection, formatMessage, insertSelectedText, isMultiple, onSelectConfirm, openDialog, selectButtonText])

		return (
			<SelectButton
				{...selectButtonComponentExtraProps}
				size="small"
				children={selectButtonText}
				onClick={onClick}
				{...selectButtonProps}
			/>
		)
	},
	() => {
		return null
	},
	'SelectFileInput',
)

