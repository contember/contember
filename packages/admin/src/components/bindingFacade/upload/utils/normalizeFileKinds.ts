import type { Environment } from '@contember/binding'
import { VariableInputTransformer } from '@contember/binding'
import type { NormalizedDiscriminatedData } from '../../discrimination'
import type { DiscriminatedFileKind, FullFileKind } from '../interfaces'

export const normalizeFileKinds = (
	rawFileKinds: DiscriminatedFileKind[],
	environment: Environment,
): NormalizedDiscriminatedData<FullFileKind> => {
	const normalized: NormalizedDiscriminatedData<FullFileKind> = new Map()

	for (const fileKind of rawFileKinds) {
		const value = VariableInputTransformer.transformValue(fileKind.discriminateBy, environment)
		normalized.set(value, {
			discriminateBy: value,
			datum: fileKind,
		})
	}

	return normalized
}
