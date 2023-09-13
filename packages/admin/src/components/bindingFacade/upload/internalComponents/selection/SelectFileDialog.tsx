import { EntityId } from '@contember/binding'
import { useChildrenAsLabel } from '@contember/react-utils'
import { Button, DialogModal, Heading } from '@contember/ui'
import { ComponentType, ReactNode, useCallback, useMemo, useState } from 'react'
import { MessageFormatter } from '../../../../../i18n'
import { UploadDictionary } from '../../uploadDictionary'
import { EntityConnector } from '../hooks/useConnectSelectedEntities'

export type SelectFileDialogProps =
	& ResolvedFileSelectionComponent
	& {
		onSelect: (entities: EntityConnector[]) => void
		onCancel: () => void
		formatMessage: MessageFormatter<UploadDictionary>
		insertSelectedText?: string
		selectButtonText: ReactNode
		isMultiple: boolean
	}


export interface ResolvedFileSelectionInnerProps {
	onToggleSelectConnector: (connector: EntityConnector) => void
	selectedEntityIds: EntityId[]
}

export type ResolvedFileSelectionComponent<SFExtraProps extends {} = {}> =
	& {
		dialogComponent: ComponentType<SFExtraProps & ResolvedFileSelectionInnerProps>
		dialogProps: SFExtraProps
	}

export const SelectFileDialog = (
	{
		onSelect,
		onCancel,
		formatMessage,
		insertSelectedText,
		selectButtonText,
		isMultiple,
		dialogComponent: Component,
		dialogProps,
	}: SelectFileDialogProps,
) => {
	const heading = useChildrenAsLabel(selectButtonText)
	const [selectedEntities, setEntities] = useState<EntityConnector[]>([])
	const onToggleSelect = useCallback((entity: EntityConnector) => {
		setEntities(current => {
			const index = current.findIndex(it => it.entity.id === entity.entity.id)
			if (index >= 0) {
				const newValues = [...current]
				newValues.splice(index, 1)
				return newValues
			}
			if (isMultiple) {
				return [...current, entity]
			} else {
				return [entity]
			}
		})
	}, [isMultiple])

	const onConfirm = useCallback(() => {
		onSelect(selectedEntities)
	}, [onSelect, selectedEntities])
	const selectedEntityIds = useMemo(() => selectedEntities.map(it => it.entity.id), [selectedEntities])

	return <>
		<DialogModal
			layout="wide"
			onClose={onCancel}
			header={<>
				<Heading>{heading}</Heading>
			</>}
			footer={<>
				<Button
					distinction="primary"
					onClick={onConfirm}
				>
					{formatMessage(insertSelectedText, 'upload.insertSelected.text')}
				</Button>
			</>}
		>
			<Component
				{...dialogProps}
				onToggleSelectConnector={onToggleSelect}
				selectedEntityIds={selectedEntityIds}
			/>
		</DialogModal>
	</>
}
