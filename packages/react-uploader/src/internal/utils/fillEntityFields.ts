import { FileType, FileWithMeta } from '../../types'
import { EntityAccessor } from '@contember/react-binding'
import { FileUploadResult } from '../../types/uploadClient'

export const executeExtractors = async ({ fileType, file, result }: { fileType: FileType; file: FileWithMeta; result: FileUploadResult }) => {
	const extractorsResult = fileType.extractors?.map(it => {
		return it.extractFileData?.(file)
	}) ?? []
	const extractionResult = await Promise.allSettled(extractorsResult)
	if (file.abortController.signal.aborted) {
		return undefined
	}
	return ({ entity }: {entity: EntityAccessor}) => {
		entity.batchUpdates(getAccessor => {
			fileType.extractors?.forEach(it => {
				return it.populateFields?.({ entity: getAccessor(), result })
			})
			extractionResult.forEach(it => {
				if (it.status === 'fulfilled') {
					it.value?.({ entity: getAccessor(), result })
				}
			})
		})

	}
}
