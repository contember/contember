import { FileType, UploaderEvents } from '../../types'
import { useReferentiallyStableCallback } from '@contember/react-utils'
import { resolveAcceptingSingleType } from '../utils/resolveAccept'
import { executeExtractors } from '../utils/fillEntityFields'
import { UploaderBaseFieldProps } from '../../types/base'
import { useRepeaterMethods } from '@contember/react-repeater'

export type UseFillEntityArgs =
	& UploaderEvents
	& UploaderBaseFieldProps
	& {
		fileType: FileType
	}

export const useCreateRepeaterEntity = ({ baseField, fileType, ...events }: UseFillEntityArgs): UploaderEvents => {
	const { addItem } = useRepeaterMethods()
	return {
		...events,
		onBeforeUpload: useReferentiallyStableCallback(async event => {
			if (!(await resolveAcceptingSingleType(event.file, fileType))) {
				return undefined
			}

			return events.onBeforeUpload?.(event) ?? fileType
		}),
		onAfterUpload: useReferentiallyStableCallback(async event => {
			await Promise.all([
				(async () => {
					const extractionResult = await executeExtractors({
						fileType,
						result: event.result,
						file: event.file,
					})
					addItem(undefined, getEntity => {
						const entity = baseField ? getEntity().getEntity({ field: baseField }) : getEntity()
						extractionResult?.({ entity })
					})
				})(),
				events.onAfterUpload?.(event),
			])
		}),
	}
}
