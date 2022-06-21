import { DiscriminatedFileKindsProps, HybridFileKindProps, SingleKindFileProps } from '../../fileKinds'
import { useMemo } from 'react'
import { fileKindTemplateAnalyzer } from '../../fileKinds/fileKindTemplateAnalyzer'
import { FileKindProps } from '../../fileKinds'
import { EntityAccessor, Environment, useEnvironment, VariableInputTransformer } from '@contember/binding'
import { ResolvedFileSelectionComponent } from './SelectFileDialog'
import { useObjectMemo } from '@contember/react-utils'
import { getResolvedSingleKindFileSelection } from './useResolvedSingleKindFileSelection'
import { createEntityConnectorFactory } from '../../fileHandler/utils/createEntityConnector'
import { DiscriminatedSelectFileDialog, DiscriminatedSelectFileDialogComponent } from './DiscriminatedSelectFileDialog'
import { DiscriminatedFileHandler } from '../../fileHandler'


export const getFileSelection = (
	props: HybridFileKindProps,
	environment: Environment,
): undefined | ResolvedFileSelectionComponent<any> => {
	if (!('discriminationField' in props)) {
		return createSingleKindFileSelection(props, environment)
	}
	return createDiscriminatedFileKinds(props, environment)
}

export const useFileSelection = (
	unstableProps: HybridFileKindProps,
) => {
	const environment = useEnvironment()
	const props = useObjectMemo(unstableProps)
	return useMemo(
		() => getFileSelection(props, environment),
		[environment, props],
	)
}

export const createSingleKindFileSelection = (
	{ fileSelectionComponent, fileSelectionProps, baseEntity }: SingleKindFileProps,
	environment: Environment,
): ResolvedFileSelectionComponent<any> | undefined => {
	return getResolvedSingleKindFileSelection({
		fileSelectionComponent,
		fileSelectionProps,
	}, () => createEntityConnectorFactory(environment, baseEntity))
}

export const createDiscriminatedFileKinds = (
	props: DiscriminatedFileKindsProps,
	environment: Environment,
): ResolvedFileSelectionComponent<any> | undefined => {
	const { children, baseEntity, fileSelectionComponent, fileSelectionProps, discriminationField } = props
	if (fileSelectionComponent) {
		return getResolvedSingleKindFileSelection({
			fileSelectionComponent,
			fileSelectionProps,
		}, () => createEntityConnectorFactory(environment, baseEntity))
	}
	const processed = fileKindTemplateAnalyzer.processChildren(children, environment)
	const fileKinds: FileKindProps[] = processed.map(node => node.value)

	const components: DiscriminatedSelectFileDialogComponent[] = []
	for (const {
		fileSelection: { fileSelectionComponent, fileSelectionLabel, fileSelectionProps },
		baseEntity: kindBaseEntity,
		discriminateBy,
	} of fileKinds) {
		if (!fileSelectionComponent) {
			continue
		}
		const label = fileSelectionLabel ?? VariableInputTransformer.transformValue(discriminateBy, environment)
		const connectorFactory = createEntityConnectorFactory(environment, baseEntity, kindBaseEntity)
		components.push({
			label,
			innerComponent: fileSelectionComponent,
			innerProps: fileSelectionProps,
			connectorFactory: (selected: EntityAccessor) => {
				const innerConnector = connectorFactory(selected)
				const connector = (parent: EntityAccessor) => {
					DiscriminatedFileHandler.fillDiscriminateBy(parent, baseEntity, discriminateBy, discriminationField)
					innerConnector(parent)
				}
				connector.entity = selected
				return connector
			},
		})
	}
	if (components.length === 0) {
		return undefined
	}
	return {
		dialogComponent: DiscriminatedSelectFileDialog,
		dialogProps: {
			components,
		},
	}
}
