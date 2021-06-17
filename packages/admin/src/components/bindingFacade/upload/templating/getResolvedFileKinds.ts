import type { Environment, SugaredFieldProps } from '@contember/binding'
import { BindingError } from '@contember/binding'
import type { ReactNode } from 'react'
import type { DiscriminatedFileKind } from '../interfaces'
import type { ResolvedFileKinds } from '../ResolvedFileKinds'
import { normalizeFileKinds } from '../utils/normalizeFileKinds'
import { fileKindTemplateAnalyzer } from './fileKindTemplateAnalyzer'

export const getResolvedFileKinds = (
	children: ReactNode,
	environment: Environment,
	discriminationField: SugaredFieldProps['field'] | undefined,
): ResolvedFileKinds => {
	const processed = fileKindTemplateAnalyzer.processChildren(children, environment)
	const fileKinds: DiscriminatedFileKind[] = processed.map(node => node.value)

	if (discriminationField) {
		const normalizedFileKinds = normalizeFileKinds(fileKinds, environment)

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
