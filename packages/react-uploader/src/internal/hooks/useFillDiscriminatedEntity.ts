import { SugaredRelativeSingleEntity, SugaredRelativeSingleField, useEntity } from '@contember/react-binding'
import { DiscriminatedFileType, DiscriminatedFileTypeMap, FileWithMeta, StartUploadEvent, UploaderEvents } from '../../types'
import { useReferentiallyStableCallback } from '@contember/react-utils'
import { disconnectAtBase } from '../utils/disconnectAtBase'
import { resolveAcceptingSingleType } from '../utils/resolveAccept'
import { executeExtractors } from '../utils/fillEntityFields'

export type UseFillEntityArgs =
	& UploaderEvents
	& {
		discriminatorField: SugaredRelativeSingleField['field']
		baseField?: SugaredRelativeSingleEntity['field']
		types: DiscriminatedFileTypeMap
	}
const fileTypeCache = new WeakMap<FileWithMeta, Promise<[string, DiscriminatedFileType]>>()
export const useFillDiscriminatedEntity = ({ baseField, types, discriminatorField, ...events }: UseFillEntityArgs): UploaderEvents => {
	const baseEntity = useEntity()

	const getResolvedFileType = useReferentiallyStableCallback(async (file: FileWithMeta) => {
		const fileTypePromise = fileTypeCache.get(file) ?? (async () => {
			for (const [name, type] of Object.entries(types)) {
				if (await resolveAcceptingSingleType(file, type)) {
					return [name, type]
				}
			}
			throw new Error('File type not accepted')
		})()
		fileTypeCache.set(file, fileTypePromise)
		return fileTypePromise
	})

	return {
		...events,
		onBeforeUpload: useReferentiallyStableCallback(async event => {
			const type = await getResolvedFileType(event.file)
			return events.onBeforeUpload?.(event) ?? type[1]
		}),
		onStartUpload: useReferentiallyStableCallback((event: StartUploadEvent) => {
			if (baseField) {
				disconnectAtBase(baseField, baseEntity)
			}

			events.onStartUpload?.(event)
		}),
		onAfterUpload: useReferentiallyStableCallback(async event => {
			await Promise.all([
				(async () => {
					const entity = baseField ? baseEntity.getEntity({ field: baseField }) : baseEntity
					const [name, fileType] = await getResolvedFileType(event.file)

					const discriminatorFieldAccessor = entity.getField({ field: discriminatorField })
					discriminatorFieldAccessor.updateValue(name)

					const typeEntity = fileType.baseField ? entity.getEntity({ field: fileType.baseField }) : entity

					const extractorsResult = await executeExtractors({
						fileType: fileType,
						file: event.file,
						result: event.result,
					})

					extractorsResult?.({ entity: typeEntity })
				})(),
				events.onAfterUpload?.(event),
			])
		}),
	}
}
