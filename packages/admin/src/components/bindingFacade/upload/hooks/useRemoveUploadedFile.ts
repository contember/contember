import { useCallback } from 'react'
import { eachFileKind } from '../utils'
import { FileId } from '@contember/react-client'
import { useBindingOperations } from '@contember/binding'
import { ResolvedFileKinds } from '../ResolvedFileKinds'

export const useRemoveUploadedFile = (
	fileKinds: ResolvedFileKinds,
) => {
	const { getEntityByKey } = useBindingOperations()

	return useCallback(
		(fileId: FileId) => {
			getEntityByKey(fileId.toString()).batchUpdates(getEntity => {

				if (fileKinds.isDiscriminated && fileKinds.baseEntity !== undefined) {
					getEntity = getEntity().getEntity(fileKinds.baseEntity).getAccessor
				}

				for (const fileKind of eachFileKind(fileKinds)) {
					const getExtractorEntity = fileKind.baseEntity === undefined
						? getEntity
						: getEntity().getEntity(fileKind.baseEntity).getAccessor

					if (fileKind.baseEntity !== undefined) {
						getExtractorEntity().deleteEntity()
					}
				}
				if (fileKinds.isDiscriminated) {
					getEntity().getField(fileKinds.discriminationField).updateValue(null)

					if (fileKinds.baseEntity !== undefined) {
						getEntity().deleteEntity()
					}
				}
			})
		},
		[getEntityByKey, fileKinds],
	)
}
