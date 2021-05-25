import { S3FileUploader, UploadedFileMetadata } from '@contember/client'
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { useCurrentContentGraphQlClient } from '../content'
import type { FileId } from './FileId'
import type { FileUploadCompoundState } from './FileUploadCompoundState'
import type { AbortUpload, FileUploadOperations, StartUpload } from './FileUploadOperations'
import { fileUploadReducer, initializeFileUploadState } from './fileUploadReducer'
import type { FileWithMetadata } from './FileWithMetadata'
import { toFileId } from './toFileId'

export type FileUpload = [FileUploadCompoundState, FileUploadOperations]

export interface FileUploadOptions {
	maxUpdateFrequency?: number // This does NOT apply to all kinds of updates.
}

export const useFileUpload = (options?: FileUploadOptions): FileUpload => {
	const maxUpdateFrequency = options?.maxUpdateFrequency ?? 100

	const contentApiClient = useCurrentContentGraphQlClient()

	const updateTimeoutRef = useRef<number | undefined>(undefined)
	const isFirstRenderRef = useRef(true)

	const [multiTemporalState, dispatch] = useReducer(fileUploadReducer, undefined, initializeFileUploadState)
	const multiTemporalStateRef = useRef(multiTemporalState)

	useEffect(() => {
		multiTemporalStateRef.current = multiTemporalState
	})

	const abortUpload = useCallback<AbortUpload>(files => {
		dispatch({
			type: 'abort',
			files,
		})
	}, [])
	const startUpload = useCallback<StartUpload>(
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
					type: 'abort',
					files: newFileIds,
				})
			dispatch({
				type: 'startUploading',
				files: fileWithMetadataByFileConfig,
			})

			try {
				uploader.upload(filesWithMetadata, {
					onProgress: progress => {
						dispatch({
							type: 'updateUploadProgress',
							progress,
						})
					},
					onSuccess: result => {
						dispatch({
							type: 'finishSuccessfully',
							result,
						})
					},
					onError: error => {
						dispatch({
							type: 'finishWithError',
							error,
						})
					},
					contentApiClient,
				})
			} catch (_) {
				dispatch({
					type: 'finishWithError',
					error: Array.from(filesWithMetadata).map(([file]) => [file, undefined]), // TODO this is crap.
				})
			}
		},
		[contentApiClient],
	)

	const operations = useMemo<FileUploadOperations>(
		() => ({
			startUpload,
			abortUpload,
		}),
		[abortUpload, startUpload],
	)

	useEffect(() => {
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
					type: 'publishNewestState',
				})
			} else {
				if (updateTimeoutRef.current !== undefined) {
					return
				}
				updateTimeoutRef.current = window.setTimeout(() => {
					dispatch({
						type: 'publishNewestState',
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

	useEffect(
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
	useEffect(() => {
		isFirstRenderRef.current = false
	}, [])

	return [multiTemporalState.publicState, operations]
}
