import { EntityAccessor, useEnvironment } from '@contember/binding'
import { ResolvedFileKinds } from '../ResolvedFileKinds'
import { useMemo } from 'react'
import { useAccessorErrorFormatter } from '../../errors'
import { getEntityFileKind } from '../utils'

export const useFileEntitiesErrors = (accessors: EntityAccessor[], fileKinds: ResolvedFileKinds) => {
	const errorFormatter = useAccessorErrorFormatter()
	const environment = useEnvironment()
	return useMemo(() => {
		const errors = []
		for (const parentEntity of accessors) {
			const parentWithBase =
				fileKinds.isDiscriminated && fileKinds.baseEntity !== undefined
					? parentEntity.getEntity(fileKinds.baseEntity)
					: parentEntity

			const fileKind = getEntityFileKind(fileKinds, parentWithBase)
			const extractorEntity = fileKind?.baseEntity ? parentWithBase.getEntity(fileKind.baseEntity) : parentWithBase
			const extractorsErrors = fileKind?.extractors.flatMap(it => it.getErrorsHolders?.({
				entity: extractorEntity,
				environment,
			}) ?? []) ?? []
			const errorHolders = [
				parentWithBase,
				...(parentWithBase === extractorEntity ? [] : [extractorEntity]),
				...extractorsErrors,
			]
			errors.push(...errorHolders.flatMap(it => errorFormatter(it.errors?.errors ?? [])))
		}
		return errors
	}, [accessors, environment, errorFormatter, fileKinds])
}
