import { SelectFileInputSelectionComponentProps } from './SelectFileInput'
import { useMemo } from 'react'
import { ResolvedFileSelectionComponent } from './SelectFileDialog'
import { EntityConnectorFactory } from '../hooks/useConnectSelectedEntities'
import { SingleKindSelectFileDialog, SingleKindSelectFileDialogExtraProps } from './SingleKindSelectFileDialog'

export const useResolvedSingleKindFileSelection = <SFExtraProps extends {}>(
	{ fileSelectionComponent, fileSelectionProps }: SelectFileInputSelectionComponentProps<SFExtraProps>,
	connectorFactoryFactory: () => EntityConnectorFactory,
): undefined | ResolvedFileSelectionComponent<SingleKindSelectFileDialogExtraProps<SFExtraProps>> => {
	return useMemo(() => {
		return getResolvedSingleKindFileSelection({ fileSelectionComponent, fileSelectionProps }, connectorFactoryFactory)
	}, [connectorFactoryFactory, fileSelectionComponent, fileSelectionProps])
}

export const getResolvedSingleKindFileSelection = <SFExtraProps extends {}>(
	{ fileSelectionComponent, fileSelectionProps }: SelectFileInputSelectionComponentProps<SFExtraProps>,
	connectorFactoryFactory: () => EntityConnectorFactory,
): undefined | ResolvedFileSelectionComponent<SingleKindSelectFileDialogExtraProps<any>> => {
	if (!fileSelectionComponent) {
		return undefined
	}
	const dialogProps: SingleKindSelectFileDialogExtraProps<SFExtraProps> = {
		innerComponent: fileSelectionComponent,
		innerProps: fileSelectionProps as SFExtraProps,
		connectorFactory: connectorFactoryFactory(),
	}
	return {
		dialogComponent: SingleKindSelectFileDialog,
		dialogProps: dialogProps,
	}
}
