import { FileType, UploaderEvents } from '../../types'
import { useReferentiallyStableCallback } from '@contember/react-utils'
import { resolveAcceptingSingleType } from '../utils/resolveAccept'
import { executeExtractors } from '../utils/fillEntityFields'
import { UploaderBaseFieldProps } from '../../types/base'
import { useRepeaterMethods } from '@contember/react-repeater'
import { useMemo, useRef } from 'react'
import { EntityAccessor } from '@contember/react-binding'

export type UseFillEntityArgs =
	& UploaderEvents
	& UploaderBaseFieldProps
	& {
		fileType: FileType
	}

export const useCreateRepeaterEntity = ({ baseField, fileType, ...events }: UseFillEntityArgs): UploaderEvents => {
	const { addItem } = useRepeaterMethods()
	const entityMap = useRef(useMemo(() => new WeakMap<File, () => EntityAccessor>(), []))

	return {
		...events,
		onBeforeUpload: useReferentiallyStableCallback(async event => {
			if (!(await resolveAcceptingSingleType(event.file, fileType))) {
				return undefined
			}
			addItem(undefined, getEntity => {
				entityMap.current.set(event.file.file, getEntity)
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
					const entity = entityMap.current.get(event.file.file)?.()
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
			const entity = entityMap.current.get(event.file.file)?.()
			if (entity) {
				entity.deleteEntity()
				entityMap.current.delete(event.file.file)
			}
			events.onError?.(event)
		}),
	}
}
