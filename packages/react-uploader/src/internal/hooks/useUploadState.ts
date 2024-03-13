import { useMemo, useState } from 'react'
import { AfterUploadEvent, BeforeUploadEvent, ErrorEvent, ProgressEvent, StartUploadEvent, SuccessEvent, UploaderEvents } from '../../types/events'
import { UploaderFileState, UploaderState } from '../../types/state'
import { useReferentiallyStableCallback } from '@contember/react-utils'

export const useUploadState = ({ onBeforeUpload, onStartUpload, onSuccess, onError, onProgress, onAfterUpload }: UploaderEvents): UploaderEvents & {
	files: UploaderState,
	purgeFinal: () => void
	purgeAll: () => void
} => {
	const [files, setFiles] = useState<Record<string, UploaderFileState>>({})

	return {
		files: useMemo(() => Object.values(files), [files]),
		purgeFinal: useReferentiallyStableCallback(() => {
			setFiles(files => {
				return Object.fromEntries(Object.entries(files).filter(([id, file]) => file.state !== 'success' && file.state !== 'error'))
			})
		}),
		purgeAll: useReferentiallyStableCallback(() => {
			setFiles({})
		}),
		onBeforeUpload: useReferentiallyStableCallback(async (event: BeforeUploadEvent) => {
			setFiles(files => ({
				...files,
				[event.file.id]: { state: 'initial', file: event.file },
			}))
			return await onBeforeUpload?.(event)
		}),
		onStartUpload: useReferentiallyStableCallback(async (event: StartUploadEvent) => {
			setFiles(files => ({
				...files,
				[event.file.id]: { state: 'uploading', file: event.file, progress: { progress: 0, uploadedBytes: 0, totalBytes: event.file.file.size } },
			}))
			return await onStartUpload?.(event)
		}),
		onProgress: useReferentiallyStableCallback((event: ProgressEvent) => {
			setFiles(files => ({
				...files,
				[event.file.id]: { state: 'uploading', file: event.file, progress: event.progress },
			}))
			onProgress?.(event)
		}),
		onAfterUpload: useReferentiallyStableCallback(async (event: AfterUploadEvent) => {
			setFiles(files => ({
				...files,
				[event.file.id]: { state: 'finalizing', file: event.file, result: event.result },
			}))
			return await onAfterUpload?.(event)
		}),
		onSuccess: useReferentiallyStableCallback((event: SuccessEvent) => {
			setFiles(files => ({
				...files,
				[event.file.id]: {
					state: 'success',
					file: event.file,
					result: event.result,
					dismiss: () => setFiles(files => {
						const { [event.file.id]: _, ...rest } = files
						return rest
					}),
				},
			}))
			onSuccess?.(event)
		}),
		onError: useReferentiallyStableCallback((event: ErrorEvent) => {
			setFiles(files => ({
				...files,
				[event.file.id]: {
					state: 'error',
					file: event.file,
					error: event.error,
					dismiss: () => setFiles(files => {
						const { [event.file.id]: _, ...rest } = files
						return rest
					}),
				},
			}))
			onError?.(event)
		}),
	}
}
