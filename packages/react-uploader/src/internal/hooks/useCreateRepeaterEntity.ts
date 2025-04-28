import { FileType, UploaderEvents } from '../../types'
import { useReferentiallyStableCallback } from '@contember/react-utils'
import { resolveAcceptingSingleType } from '../utils/resolveAccept'
import { executeExtractors } from '../utils/fillEntityFields'
import { UploaderBaseFieldProps } from '../../types/base'
import { useRepeaterMethods } from '@contember/react-repeater'
import { useState } from 'react'
import { EntityAccessor } from '@contember/react-binding'

export type UseFillEntityArgs =
	& UploaderEvents
	& UploaderBaseFieldProps
	& {
		fileType: FileType
	}

export const useCreateRepeaterEntity = ({ baseField, fileType, ...events }: UseFillEntityArgs): UploaderEvents & {
	entityToFileId: Map<EntityAccessor.GetEntityAccessor, string>
} => {
	const { addItem } = useRepeaterMethods()
	const [entityMap] = useState(() => new WeakMap<File, EntityAccessor.GetEntityAccessor>())
	const [entityToFileId] = useState(() => new Map<EntityAccessor.GetEntityAccessor, string>())

	return {
		...events,
		entityToFileId,
		onBeforeUpload: useReferentiallyStableCallback(async event => {
			if (!(await resolveAcceptingSingleType(event.file, fileType))) {
				return undefined
			}
			addItem(undefined, getEntity => {
				entityMap.set(event.file.file, getEntity)
				entityToFileId.set(getEntity, event.file.id)
			})

			return (await events.onBeforeUpload?.(event)) ?? fileType
		}),
		onAfterUpload: useReferentiallyStableCallback(async event => {
			await Promise.all([
				(async () => {
					const extractionResult = await executeExtractors({
						fileType,
						result: event.result,
						file: event.file,
					})
					const entity = entityMap.get(event.file.file)?.()
					if (!entity) {
						throw new Error('Entity not found')
					}
					const baseEntity = baseField ? entity.getEntity({ field: baseField }) : entity
					extractionResult?.({ entity: baseEntity })
				})(),
				events.onAfterUpload?.(event),
			])
		}),
		onError: useReferentiallyStableCallback(event => {
			const entity = entityMap.get(event.file.file)?.()
			if (entity) {
				entity.deleteEntity()
				entityMap.delete(event.file.file)
			}
			events.onError?.(event)
		}),
	}
}
