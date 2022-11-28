import { FileUploader, S3FileUploader, UploadedFileMetadata } from '@contember/client'
import { Reducer, useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { useCurrentContentGraphQlClient } from '../content'
import type { FileId } from './FileId'
import type { FileUploadAction } from './FileUploadAction'
import type { FileUploadCompoundState } from './FileUploadCompoundState'
import type { FileUploadMetadata } from './FileUploadMetadata'
import type { FileUploadMultiTemporalState } from './FileUploadMultiTemporalState'
import type {
	PurgeUpload,
	FileUploadOperations,
	InitializeUpload,
	StartUpload,
	StartUploadFileOptions,
	FailUpload,
} from './FileUploadOperations'
import { fileUploadReducer, initializeFileUploadState } from './fileUploadReducer'
import type { FileWithMetadata } from './FileWithMetadata'
import { toFileId } from './toFileId'

export type FileUpload<Result = unknown, Metadata = undefined> = [
	FileUploadCompoundState<Result, Metadata>,
	FileUploadOperations<Metadata>,
]

export interface FileUploadOptions {
}

export const useFileUpload = <Result = unknown, Metadata = undefined>({}: FileUploadOptions = {}): FileUpload<Result, Metadata> => {
	const contentApiClient = useCurrentContentGraphQlClient()

	const fileIdSeedRef = useRef(1)

	const [internalState, dispatch] = useReducer<
		Reducer<FileUploadMultiTemporalState<Result, Metadata>, FileUploadAction<Result, Metadata>>,
		undefined
	>(fileUploadReducer, undefined, initializeFileUploadState)
	const internalStateRef = useRef(internalState)

	const defaultUploader = useMemo(() => new S3FileUploader(), [])

	useEffect(() => {
		internalStateRef.current = internalState
	})

	const purgeUpload = useCallback<PurgeUpload>(files => {
		dispatch({
			type: 'purge',
			files,
		})
	}, [])
	const failUpload = useCallback<FailUpload>(error => {
		dispatch({
			type: 'finishWithError',
			error,
		})
	}, [])
	const initializeUpload = useCallback<InitializeUpload>(
		files => {
			const newFileIds = new Set<FileId>()
			const fileWithMetadataByFileConfig = new Map<FileId, FileWithMetadata>()

			for (const fileMaybeWithId of files) {
				const abortController = new AbortController()

				let fileId: FileId
				let file: File

				if (fileMaybeWithId instanceof File) {
					fileId = `__contember__file-${fileIdSeedRef.current++}`
					file = fileMaybeWithId
				} else {
					fileId = fileMaybeWithId[0]
					file = fileMaybeWithId[1]
				}

				abortController.signal.addEventListener('abort', () => {
					purgeUpload([fileId])
				})

				fileWithMetadataByFileConfig.set(fileId, {
					previewUrl: URL.createObjectURL(file),
					abortController,
					file,
					fileId,
				})

				newFileIds.add(fileId)
			}
			if (fileWithMetadataByFileConfig.size === 0) {
				return fileWithMetadataByFileConfig
			}

			if (newFileIds.size) {
				dispatch({
					type: 'purge',
					files: newFileIds,
				})
			}

			dispatch({
				type: 'initialize',
				files: fileWithMetadataByFileConfig,
			})

			return fileWithMetadataByFileConfig
		},
		[purgeUpload],
	)
	const startUpload = useCallback<StartUpload<Metadata>>(
		files => {
			const filesById = new Map<FileId, FileUploadMetadata<Metadata>>()
			const groupedByUploader: Map<FileUploader, Map<File, UploadedFileMetadata>> = new Map()

			const currentState = internalStateRef.current

			for (const fileOrIdMaybeWithOptions of files) {
				let fileOrId: File | FileId
				let options: StartUploadFileOptions<Metadata>

				if (Array.isArray(fileOrIdMaybeWithOptions)) {
					fileOrId = fileOrIdMaybeWithOptions[0]
					options = fileOrIdMaybeWithOptions[1]
				} else {
					fileOrId = fileOrIdMaybeWithOptions
					options = {}
				}
				const { uploader = defaultUploader, metadata } = options

				const fileId = toFileId(currentState, fileOrId)
				const fileState = currentState.state.get(fileId)

				if (fileState === undefined || fileState.readyState !== 'initializing') {
					throw new Error(
						`Trying to startUpload a file that hasn't been previously initialized. ` +
							`This will be possible in future, but isn't yet.`,
					)
				}

				filesById.set(fileId, {
					uploader,
					metadata,
				})

				let filesWithSameUploader = groupedByUploader.get(uploader)
				if (filesWithSameUploader === undefined) {
					groupedByUploader.set(uploader, (filesWithSameUploader = new Map()))
				}
				filesWithSameUploader.set(fileState.file, {
					abortSignal: fileState.abortController.signal,
				})
			}

			dispatch({
				type: 'startUploading',
				files: filesById,
			})

			for (const [uploader, filesForUpload] of groupedByUploader) {
				try {
					uploader.upload(filesForUpload, {
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
				} catch (error) {
					dispatch({
						type: 'finishWithError',
						error: Array.from(filesForUpload).map(([file]) => [file, error]),
					})
				}
			}
		},
		[contentApiClient, defaultUploader],
	)

	const operations = useMemo<FileUploadOperations<Metadata>>(
		() => ({
			failUpload,
			initializeUpload,
			purgeUpload,
			startUpload,
		}),
		[failUpload, initializeUpload, purgeUpload, startUpload],
	)


	useEffect(
		() => () => {
			for (const [, state] of internalStateRef.current.state) {
				URL.revokeObjectURL(state.previewUrl)
			}
		},
		[],
	)

	return [internalState.state, operations]
}
