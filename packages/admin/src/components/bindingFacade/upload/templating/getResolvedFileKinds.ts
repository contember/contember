import type { Environment, SugaredFieldProps } from '@contember/binding'
import { BindingError, EntityAccessor, useEnvironment, VariableInputTransformer } from '@contember/binding'
import type { NormalizedDiscriminatedData } from '../../discrimination'
import type { DiscriminatedFileKind, FullFileKind } from '../interfaces'
import type { ResolvedDiscriminatedFileKinds, ResolvedFileKinds, ResolvedSimpleFileKinds } from '../ResolvedFileKinds'
import { fileKindTemplateAnalyzer } from './fileKindTemplateAnalyzer'
import { ReactNode, useMemo } from 'react'
import { SelectFileInputFormComponentProps } from '../internalComponents/SelectFileInput'

type DiscriminatedFileKindsProps<SFExtraProps extends {} = {}> =
	& (
		| SelectFileInputFormComponentProps<SFExtraProps>
		| {}
	)
	& {
		discriminationField: SugaredFieldProps['field']
		children: ReactNode
		baseEntity?: string
	}

type SimpleFileKindProps<SFExtraProps extends {} = {}> =
	& FullFileKind<unknown, unknown, SFExtraProps>
	& {
		hasUploadedFile: (entity: EntityAccessor) => boolean
	}

export type HybridFileKindProps<SFExtraProps extends {} = {}> =
	| DiscriminatedFileKindsProps<SFExtraProps>
	| SimpleFileKindProps<SFExtraProps>

export const getResolvedFileKinds = (
	props: HybridFileKindProps,
	environment: Environment,
	componentName: string,
): ResolvedFileKinds => {
	if (!('discriminationField' in props)) {
		return createSimpleFileKind(props)
	}
	return createDiscriminatedFileKinds(props, environment, componentName)
}

export const useFileKinds = (
	props: HybridFileKindProps,
	componentName: string,
) => {
	const environment = useEnvironment()
	return useMemo(
		() => getResolvedFileKinds(props, environment, componentName),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[environment, ...'discriminationField' in props
			? [props.discriminationField, props.children, props.baseEntity]
			: [props.hasUploadedFile, props.children, props.acceptFile, props.acceptMimeTypes, props.baseEntity, props.renderFilePreview, props.renderUploadedFile, props.extractors, props.uploader]],
	)
}

export const createSimpleFileKind = (
	props: SimpleFileKindProps<any>,
): ResolvedSimpleFileKinds => {
	const {
		hasUploadedFile,
		children,
		acceptFile,
		acceptMimeTypes,
		baseEntity,
		renderFilePreview,
		renderUploadedFile,
		extractors,
		uploader,
		...rest
	} = props

	return {
		isDiscriminated: false,
		hasFileSelection: 'selectFormComponent' in rest,
		fileKind: {
			acceptFile,
			acceptMimeTypes,
			baseEntity,
			children,
			extractors,
			renderFilePreview,
			renderUploadedFile,
			uploader,
			...rest,
		},
		hasUploadedFile: hasUploadedFile!,
	}
}

export const createDiscriminatedFileKinds = (
	props: DiscriminatedFileKindsProps,
	environment: Environment,
	componentName: string,
): ResolvedDiscriminatedFileKinds => {
	const { discriminationField, children, baseEntity } = props
	const processed = fileKindTemplateAnalyzer.processChildren(children, environment)
	const fileKinds: DiscriminatedFileKind[] = processed.map(node => node.value)

	const normalizedFileKinds: NormalizedDiscriminatedData<FullFileKind> = new Map()
	let hasFileSelection = 'selectFormComponent' in props
	for (const fileKind of fileKinds) {
		const value = VariableInputTransformer.transformValue(fileKind.discriminateBy, environment)
		if ('selectFormComponent' in fileKind) {
			hasFileSelection = true
		}
		normalizedFileKinds.set(value, {
			discriminateBy: value,
			datum: fileKind,
		})
	}

	if (!normalizedFileKinds.size) {
		throw new BindingError(
			`${componentName}: having supplied the 'discriminationField' prop, you must specify at least one file kind!`,
		)
	}

	return {
		isDiscriminated: true,
		hasFileSelection,
		discriminationField,
		baseEntity,
		fileKinds: normalizedFileKinds,
		...('selectFormComponent' in props ? {
			selectFormComponent: props.selectFormComponent,
			selectFormProps: props.selectFormProps,
		} : {}),
	}
}
