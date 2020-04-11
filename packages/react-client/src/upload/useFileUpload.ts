import { FileUploaderInitializeOptions, S3FileUploader, UploadedFileMetadata } from '@contember/client'
import * as React from 'react'
import { useSessionToken } from '../auth'
import { useCurrentContentGraphQlClient } from '../content'
import { FileUploadAction } from './FileUploadAction'
import { FileUploadActionType } from './FileUploadActionType'
import { FileUploadCompoundState } from './FileUploadCompoundState'
import { FileUploadMultiTemporalState } from './FileUploadMultiTemporalState'
import { AbortUpload, FileUploadOperations, StartUpload } from './FileUploadOperations'
import { fileUploadReducer, initializeFileUploadState } from './fileUploadReducer'
import { InternalFileMetadata } from './InternalFileMetadata'

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

	const abortUpload = React.useCallback<AbortUpload>(files => {
		dispatch({
			type: FileUploadActionType.Abort,
			files,
		})
	}, [])
	const startUpload = React.useCallback<StartUpload>(
		(files, uploader = new S3FileUploader()) => {
			const filesWithInternalMetadata = new Map<File, InternalFileMetadata>()
			const filesWithMetadata = new Map<File, UploadedFileMetadata>()

			for (const file of files) {
				const abortController = new AbortController()
				filesWithInternalMetadata.set(file, {
					previewUrl: URL.createObjectURL(file),
					abortController,
					uploader,
				})
				filesWithMetadata.set(file, {
					abortSignal: abortController.signal,
				})
			}

			dispatch({
				type: FileUploadActionType.StartUploading,
				files: filesWithInternalMetadata,
			})

			const options: FileUploaderInitializeOptions = {
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
			}

			uploader.upload(filesWithMetadata, options)
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
		if (multiTemporalState.publicState !== multiTemporalState.liveState) {
			const now = Date.now()
			const timeDelta = now - multiTemporalState.lastUpdateTime
			if (timeDelta > maxUpdateFrequency) {
				if (updateTimeoutRef.current !== undefined) {
					clearTimeout(updateTimeoutRef.current)
				}
				dispatch({
					type: FileUploadActionType.PublishNewestState,
				})
			} else {
				if (updateTimeoutRef.current === undefined) {
					updateTimeoutRef.current = window.setTimeout(() => {
						dispatch({
							type: FileUploadActionType.PublishNewestState,
						})
						updateTimeoutRef.current = undefined
					}, timeDelta)
				}
			}
		}
	}, [
		multiTemporalState.lastUpdateTime,
		multiTemporalState.liveState,
		multiTemporalState.publicState,
		maxUpdateFrequency,
	])

	React.useEffect(
		() => () => {
			for (const [, state] of multiTemporalState.liveState) {
				if (state !== undefined) {
					URL.revokeObjectURL(state.previewUrl)
				}
			}
		},
		[multiTemporalState.liveState],
	)

	// For this to work, this effect must be the last one to run.
	React.useEffect(() => {
		isFirstRenderRef.current = false
	}, [])

	return [multiTemporalState.publicState, operations]
}
