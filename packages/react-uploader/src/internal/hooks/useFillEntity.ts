import { useEntity } from '@contember/react-binding'
import { FileType, StartUploadEvent, UploaderEvents } from '../../types/index.js'
import { useReferentiallyStableCallback } from '@contember/react-utils'
import { disconnectAtBase } from '../utils/disconnectAtBase.js'
import { resolveAcceptingSingleType } from '../utils/resolveAccept.js'
import { UploaderBaseFieldProps } from '../../types/base.js'
import { executeExtractors } from '../utils/fillEntityFields.js'

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

			return (await events.onBeforeUpload?.(event)) ?? fileType
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
