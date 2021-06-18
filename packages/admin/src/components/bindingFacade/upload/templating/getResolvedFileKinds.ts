import type { Environment, SugaredFieldProps } from '@contember/binding'
import { BindingError, VariableInputTransformer } from '@contember/binding'
import type { NormalizedDiscriminatedData } from '../../discrimination'
import type { DiscriminatedFileKind, FullFileKind } from '../interfaces'
import type { ResolvedFileKinds } from '../ResolvedFileKinds'
import { fileKindTemplateAnalyzer } from './fileKindTemplateAnalyzer'

export interface HybridFileKindProps extends Partial<FullFileKind> {
	discriminationField?: SugaredFieldProps['field']
}

export const getResolvedFileKinds = (
	{
		discriminationField,
		children,
		acceptFile,
		acceptMimeTypes,
		renderFilePreview,
		renderUploadedFile,
		extractors,
		uploader,
	}: HybridFileKindProps,
	environment: Environment,
): ResolvedFileKinds => {
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
				`Upload: having supplied the 'discriminationField' prop, you must specify at least one file kind!`,
			)
		}

		return {
			isDiscriminated: true,
			discriminationField,
			fileKinds: normalizedFileKinds,
		}
	}
	if (fileKinds.length > 1) {
		throw new BindingError(
			`Upload: having supplied several FileKinds, you must also specify the 'discriminationField'!`,
		)
	}
	return {
		isDiscriminated: false,
		fileKind: fileKinds[0],
	}
}
