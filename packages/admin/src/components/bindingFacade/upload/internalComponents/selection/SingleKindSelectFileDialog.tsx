import { DeferredSubTrees } from '@contember/binding'
import { ComponentType, useCallback } from 'react'
import { EntityConnectorFactory } from '../hooks/useConnectSelectedEntities'
import { FileSelectionProps } from './SelectFileInput'
import { ResolvedFileSelectionInnerProps } from './SelectFileDialog'

export type SingleKindSelectFileDialogExtraProps<SFExtraProps extends {}> =
	& {
		innerComponent: ComponentType<SFExtraProps & FileSelectionProps>
		innerProps: SFExtraProps
		connectorFactory: EntityConnectorFactory
	}

export type SingleKindSelectFileDialogProps<SFExtraProps extends {} = {}> =
	& ResolvedFileSelectionInnerProps
	& SingleKindSelectFileDialogExtraProps<SFExtraProps>

export const SingleKindSelectFileDialog = (
	{
		selectedEntityIds,
		onToggleSelectConnector,
		connectorFactory,
		innerComponent: Component,
		innerProps,
	}: SingleKindSelectFileDialogProps,
) => {
	const onToggleSelect = useCallback(entity => {
		onToggleSelectConnector(connectorFactory(entity))
	}, [connectorFactory, onToggleSelectConnector])
	return <>
		<DeferredSubTrees fallback={<>Loading...</>}>
			<Component
				{...innerProps}
				onToggleSelect={onToggleSelect}
				selectedEntityIds={selectedEntityIds}
			/>
		</DeferredSubTrees>
	</>
}
