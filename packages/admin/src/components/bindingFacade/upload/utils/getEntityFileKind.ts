import { BindingError, EntityAccessor } from '@contember/binding'
import type { FullFileKind } from '../interfaces'
import type { ResolvedFileKinds } from '../ResolvedFileKinds'

export const getEntityFileKind = (
	fileKinds: ResolvedFileKinds,
	getContainingEntity: EntityAccessor.GetEntityAccessor,
): FullFileKind => {
	if (!fileKinds.isDiscriminated) {
		return fileKinds.fileKind
	}
	const discriminant = getContainingEntity().getField(fileKinds.discriminationField).value
	const fileKind = fileKinds.fileKinds.get(discriminant)

	if (fileKind === undefined) {
		throw new BindingError()
	}
	return fileKind.datum
}
