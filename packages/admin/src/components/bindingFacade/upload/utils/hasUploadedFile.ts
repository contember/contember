import type { EntityAccessor } from '@contember/binding'
import type { ResolvedFileKinds } from '../ResolvedFileKinds'

export const hasUploadedFile = (fileKinds: ResolvedFileKinds, entity: EntityAccessor): boolean => {
	if (fileKinds.isDiscriminated) {
		return entity.getField(fileKinds.discriminationField).value !== null
	}
	return fileKinds.hasUploadedFile(
		fileKinds.fileKind.baseEntity === undefined ? entity : entity.getEntity(fileKinds.fileKind.baseEntity),
	)
}
