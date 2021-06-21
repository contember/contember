import type { Environment, SugaredFieldProps } from '@contember/binding'
import { BindingError, EntityAccessor, VariableInputTransformer } from '@contember/binding'
import type { NormalizedDiscriminatedData } from '../../discrimination'
import type { DiscriminatedFileKind, FullFileKind } from '../interfaces'
import type { ResolvedFileKinds } from '../ResolvedFileKinds'
import { fileKindTemplateAnalyzer } from './fileKindTemplateAnalyzer'

export interface HybridFileKindProps extends Partial<FullFileKind> {
	discriminationField?: SugaredFieldProps['field']
	hasUploadedFile?: (entity: EntityAccessor) => boolean
}

export const getResolvedFileKinds = (
	props: HybridFileKindProps,
	environment: Environment,
	componentName: string,
): ResolvedFileKinds => {
	const {
		discriminationField,
		hasUploadedFile,
		children,
		acceptFile,
		acceptMimeTypes,
		renderFilePreview,
		renderUploadedFile,
		extractors,
		uploader,
	} = props

	if (
		acceptFile !== undefined ||
		acceptMimeTypes !== undefined ||
		hasUploadedFile !== undefined ||
		renderFilePreview !== undefined ||
		renderUploadedFile !== undefined ||
		extractors !== undefined ||
		uploader !== undefined
	) {
		if (discriminationField !== undefined) {
			throw new BindingError(
				`${componentName}: with a top-level file-kind prop supplied, single file kind mode is in on. ` +
					`Thus the 'discriminationField' prop has no effect.`,
			)
		}
		const mandatoryPropNames = [
			// 'acceptFile' // Deliberately left out
			'acceptMimeTypes',
			'hasUploadedFile',
			'renderFilePreview',
			'renderUploadedFile',
			'extractors',
			'uploader',
		] as const
		for (const propName of mandatoryPropNames) {
			if (props[propName] === undefined) {
				throw new BindingError(`${componentName}: the single file-kind mode is on but the '${propName}' is missing.`)
			}
		}

		return {
			isDiscriminated: false,
			fileKind: {
				acceptFile,
				acceptMimeTypes: acceptMimeTypes!,
				children,
				extractors: extractors!,
				renderFilePreview: renderFilePreview!,
				renderUploadedFile,
				uploader: uploader!,
			},
			hasUploadedFile: hasUploadedFile!,
		}
	}
	const processed = fileKindTemplateAnalyzer.processChildren(children, environment)
	const fileKinds: DiscriminatedFileKind[] = processed.map(node => node.value)

	if (discriminationField) {
		const normalizedFileKinds: NormalizedDiscriminatedData<FullFileKind> = new Map()

		for (const fileKind of fileKinds) {
			const value = VariableInputTransformer.transformValue(fileKind.discriminateBy, environment)
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
			discriminationField,
			fileKinds: normalizedFileKinds,
		}
	}
	throw new BindingError(
		`${componentName}: you must supply either the 'discriminationField' prop and at least one FileKind, ` +
			`or specify all of the top-level file-kind props directly!`,
	)
}
