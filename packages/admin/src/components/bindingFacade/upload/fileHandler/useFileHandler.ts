import type { Environment } from '@contember/binding'
import { BindingError, useEnvironment, VariableInputTransformer } from '@contember/binding'
import type { NormalizedDiscriminatedData } from '../../discrimination'
import {
	DiscriminatedFileKindsProps,
	FileKindProps,
	FullFileKind,
	HybridFileKindProps,
	SingleKindFileProps,
} from '../fileKinds'
import { useMemo } from 'react'
import { useObjectMemo } from '@contember/react-utils'
import { FileHandler } from './FileHandler'
import { SingleKindFileHandler } from './SingleKindFileHandler'
import { DiscriminatedFileHandler } from './DiscriminatedFileHandler'
import { fileKindTemplateAnalyzer } from '../fileKinds/fileKindTemplateAnalyzer'


export const getFileHandler = (
	props: HybridFileKindProps,
	environment: Environment,
	componentName: string,
): FileHandler => {
	if (!('discriminationField' in props)) {
		return createSingleKindFileHandler(props)
	}
	return createDiscriminatedFileKinds(props, environment, componentName)
}

export const useFileHandler = (
	unstableProps: HybridFileKindProps,
	componentName: string,
) => {
	const environment = useEnvironment()
	const props = useObjectMemo(unstableProps)
	return useMemo(
		() => getFileHandler(props, environment, componentName),
		[componentName, environment, props],
	)
}

export const createSingleKindFileHandler = (
	props: SingleKindFileProps,
): FileHandler => {
	const { hasUploadedFile, children, acceptFile, acceptMimeTypes, baseEntity, renderFilePreview, renderUploadedFile, extractors, uploader } = props

	return new SingleKindFileHandler(
		{
			acceptFile,
			acceptMimeTypes,
			baseEntity,
			children,
			extractors,
			renderFilePreview,
			renderUploadedFile,
			uploader,
		},
		hasUploadedFile,
	)
}

export const createDiscriminatedFileKinds = (
	props: DiscriminatedFileKindsProps,
	environment: Environment,
	componentName: string,
): FileHandler => {
	const { discriminationField, children, baseEntity } = props
	const processed = fileKindTemplateAnalyzer.processChildren(children, environment)
	const fileKinds: FileKindProps[] = processed.map(node => node.value)

	const normalizedFileKinds: NormalizedDiscriminatedData<FullFileKind> = new Map()
	for (const { acceptFile, acceptMimeTypes, baseEntity, children, extractors, renderFilePreview, renderUploadedFile, uploader, discriminateBy } of fileKinds) {
		const value = VariableInputTransformer.transformValue(discriminateBy, environment)
		normalizedFileKinds.set(value, {
			discriminateBy: value,
			datum: {
				acceptFile,
				acceptMimeTypes,
				baseEntity,
				children,
				extractors,
				renderFilePreview,
				renderUploadedFile,
				uploader,
			},
		})
	}

	if (!normalizedFileKinds.size) {
		throw new BindingError(
			`${componentName}: having supplied the 'discriminationField' prop, you must specify at least one file kind!`,
		)
	}


	return new DiscriminatedFileHandler(
		discriminationField,
		baseEntity,
		normalizedFileKinds,
	)
}
