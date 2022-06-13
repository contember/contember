import type { EntityAccessor } from '@contember/binding'
import type { FullFileKind } from '../interfaces'
import type { ResolvedFileKinds } from '../ResolvedFileKinds'

export const getEntityFileKind = (
	fileKinds: ResolvedFileKinds,
	containingEntity: EntityAccessor,
): FullFileKind | undefined => {
	if (!fileKinds.isDiscriminated) {
		return fileKinds.fileKind
	}
	const discriminant = containingEntity.getField(fileKinds.discriminationField).value
	const fileKind = fileKinds.fileKinds.get(discriminant)

	if (fileKind === undefined) {
		return undefined
	}
	return fileKind.datum
}
