import { useEntity } from '@contember/react-binding'
import { FileType, StartUploadEvent, UploaderEvents } from '../../types'
import { useReferentiallyStableCallback } from '@contember/react-utils'
import { disconnectAtBase } from '../utils/disconnectAtBase'
import { resolveAcceptingSingleType } from '../utils/resolveAccept'
import { UploaderBaseFieldProps } from '../../types/base'
import { executeExtractors } from '../utils/fillEntityFields'

export type UseFillEntityArgs =
	& UploaderEvents
	& UploaderBaseFieldProps
	& {
		fileType: FileType
	}

export const useFillEntity = ({ baseField, fileType, ...events }: UseFillEntityArgs): UploaderEvents => {
	const baseEntity = useEntity()
	return {
		...events,
		onBeforeUpload: useReferentiallyStableCallback(async event => {
			if (!(await resolveAcceptingSingleType(event.file, fileType))) {
				return undefined
			}

			return events.onBeforeUpload?.(event) ?? fileType
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
					const extractionResult = await executeExtractors({
						fileType,
						result: event.result,
						file: event.file,
					})
					extractionResult?.({ entity })
				})(),
				events.onAfterUpload?.(event),
			])
		}),
	}
}
