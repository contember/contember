import { SugaredFieldProps, useEnvironment } from '@contember/binding'
import { useMemo } from 'react'
import type { DiscriminatedFileKind, FullFileKind } from '../interfaces'
import type { ResolvedFileKinds } from '../ResolvedFileKinds'
import { normalizeFileKinds } from './normalizeFileKinds'

export const useResolvedFileKinds = (
	rawFileKinds: FullFileKind | DiscriminatedFileKind[],
	discriminationField: SugaredFieldProps['field'] | undefined,
) => {
	const environment = useEnvironment()
	return useMemo<ResolvedFileKinds>(() => {
		if (Array.isArray(rawFileKinds)) {
			return {
				isDiscriminated: true,
				fileKinds: normalizeFileKinds(rawFileKinds, environment),
				discriminationField: discriminationField!,
			}
		}
		return {
			isDiscriminated: false,
			fileKind: rawFileKinds,
		}
	}, [environment, discriminationField, rawFileKinds])
}
