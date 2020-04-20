import { S3FileUploader, UploadedFileMetadata } from '@contember/client'
import * as React from 'react'
import { useSessionToken } from '../auth'
import { useCurrentContentGraphQlClient } from '../content'
import { FileId } from './FileId'
import { FileUploadActionType } from './FileUploadActionType'
import { FileUploadCompoundState } from './FileUploadCompoundState'
import { AbortUpload, FileUploadOperations, StartUpload } from './FileUploadOperations'
import { fileUploadReducer, initializeFileUploadState } from './fileUploadReducer'
import { FileWithMetadata } from './FileWithMetadata'
import { toFileId } from './toFileId'

export type FileUpload = [FileUploadCompoundState, FileUploadOperations]

export interface FileUploadOptions {
	maxUpdateFrequency?: number // This does NOT apply to all kinds of updates.
}

export const useFileUpload = (options?: FileUploadOptions): FileUpload => {
	const maxUpdateFrequency = options?.maxUpdateFrequency ?? 250

	const client = useCurrentContentGraphQlClient()
	const contentApiToken = useSessionToken()

	const updateTimeoutRef = React.useRef<number | undefined>(undefined)
	const isFirstRenderRef = React.useRef(true)

	const [multiTemporalState, dispatch] = React.useReducer(fileUploadReducer, undefined, initializeFileUploadState)
	const multiTemporalStateRef = React.useRef(multiTemporalState)

	React.useEffect(() => {
		multiTemporalStateRef.current = multiTemporalState
	})

	const abortUpload = React.useCallback<AbortUpload>(files => {
		dispatch({
			type: FileUploadActionType.Abort,
			files,
		})
	}, [])
	const startUpload = React.useCallback<StartUpload>(
		(files, options = {}) => {
			const newFileIds = new Set<FileId>()
			const { uploader = new S3FileUploader() } = options
			const fileWithMetadataByFileConfig = new Map<[FileId, File] | File, FileWithMetadata>()
			const filesWithMetadata = new Map<File, UploadedFileMetadata>()

			for (const fileWithMaybeId of files) {
				const abortController = new AbortController()
				const file = fileWithMaybeId instanceof File ? fileWithMaybeId : fileWithMaybeId[1]
				fileWithMetadataByFileConfig.set(fileWithMaybeId, {
					previewUrl: URL.createObjectURL(file),
					abortController,
					uploader,
					file,
				})
				filesWithMetadata.set(file, {
					abortSignal: abortController.signal,
				})

				const fileId: FileId | undefined = Array.isArray(fileWithMaybeId)
					? fileWithMaybeId[0]
					: toFileId(multiTemporalStateRef.current, file)
				fileId && newFileIds.add(fileId)
			}
			if (fileWithMetadataByFileConfig.size === 0) {
				return
			}

			newFileIds.size &&
				dispatch({
					type: FileUploadActionType.Abort,
					files: newFileIds,
				})
			dispatch({
				type: FileUploadActionType.StartUploading,
				files: fileWithMetadataByFileConfig,
			})

			try {
				uploader.upload(filesWithMetadata, {
					onProgress: progress => {
						dispatch({
							type: FileUploadActionType.UpdateUploadProgress,
							progress,
						})
					},
					onSuccess: result => {
						dispatch({
							type: FileUploadActionType.FinishSuccessfully,
							result,
						})
					},
					onError: error => {
						dispatch({
							type: FileUploadActionType.FinishWithError,
							error,
						})
					},
					contentApiToken,
					client,
				})
			} catch (_) {
				dispatch({
					type: FileUploadActionType.FinishWithError,
					error: Array.from(filesWithMetadata).map(([file]) => [file, undefined]), // TODO this is crap.
				})
			}
		},
		[client, contentApiToken],
	)

	const operations = React.useMemo<FileUploadOperations>(
		() => ({
			startUpload,
			abortUpload,
		}),
		[abortUpload, startUpload],
	)

	React.useEffect(() => {
		if (isFirstRenderRef.current) {
			return
		}
		if (multiTemporalState.isLiveStateDirty) {
			const now = Date.now()
			const timeDelta = Math.max(now - multiTemporalState.lastUpdateTime, 0) // The max is just a sanity check
			if (timeDelta > maxUpdateFrequency) {
				if (updateTimeoutRef.current !== undefined) {
					clearTimeout(updateTimeoutRef.current)
				}
				dispatch({
					type: FileUploadActionType.PublishNewestState,
				})
			} else {
				if (updateTimeoutRef.current !== undefined) {
					return
				}
				updateTimeoutRef.current = window.setTimeout(() => {
					dispatch({
						type: FileUploadActionType.PublishNewestState,
					})
					updateTimeoutRef.current = undefined
				}, maxUpdateFrequency - timeDelta)
			}
		}
	}, [
		multiTemporalState.isLiveStateDirty,
		multiTemporalState.lastUpdateTime,
		multiTemporalState.liveState,
		multiTemporalState.publicState,
		maxUpdateFrequency,
	])

	React.useEffect(
		() => () => {
			for (const [, state] of multiTemporalStateRef.current.liveState) {
				URL.revokeObjectURL(state.previewUrl)
			}
			for (const [, state] of multiTemporalStateRef.current.publicState) {
				URL.revokeObjectURL(state.previewUrl)
			}
		},
		[],
	)

	// For this to work, this effect must be the last one to run.
	React.useEffect(() => {
		isFirstRenderRef.current = false
	}, [])

	return [multiTemporalState.publicState, operations]
}
