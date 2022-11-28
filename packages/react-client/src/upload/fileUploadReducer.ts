import { FileUploadError } from '@contember/client'
import { assertNever } from '../utils'
import type { FileId } from './FileId'
import type { FileUploadAction } from './FileUploadAction'
import type { FileUploadMultiTemporalState } from './FileUploadMultiTemporalState'
import { toFileId } from './toFileId'

export const initializeFileUploadState = <Result = unknown, Metadata = undefined>(): FileUploadMultiTemporalState<Result, Metadata> => ({
	fileIdByFile: new WeakMap<File, FileId>(),
	state: new Map(),
})

export const fileUploadReducer = <Result = unknown, Metadata = undefined>(
	previousState: FileUploadMultiTemporalState<Result, Metadata>,
	action: FileUploadAction<Result, Metadata>,
): FileUploadMultiTemporalState<Result, Metadata> => {
	let newState: undefined | FileUploadMultiTemporalState<Result, Metadata>['state'] = undefined

	switch (action.type) {
		case 'initialize': {
			for (const [fileId, metadata] of action.files) {
				// Deliberately allowing starting a new upload with the same id
				(newState ??= new Map(previousState.state)).set(fileId, {
					readyState: 'initializing',
					abortController: metadata.abortController,
					previewUrl: metadata.previewUrl,
					file: metadata.file,
				})
				// Deliberately mutating
				previousState.fileIdByFile.set(metadata.file, fileId)
			}
			break
		}
		case 'startUploading': {
			for (const [fileOrId, metadata] of action.files) {
				const fileId = toFileId(previousState, fileOrId)
				const fileState = (newState ?? previousState.state).get(fileId)

				if (fileState === undefined || fileState.readyState !== 'initializing') {
					continue
				}

				(newState ??= new Map(previousState.state)).set(fileId, {
					readyState: 'uploading',
					abortController: fileState.abortController,
					file: fileState.file,
					metadata: metadata.metadata!, // If the user didn't supply the metadata, then that's on them.
					previewUrl: fileState.previewUrl,
					progress: undefined,
					uploader: metadata.uploader,
				})
			}
			break
		}
		case 'finishSuccessfully': {
			for (const [fileOrId, result] of action.result) {
				const fileId = toFileId(previousState, fileOrId)
				const previousFileState = (newState ?? previousState.state).get(fileId)
				if (previousFileState === undefined || previousFileState.readyState !== 'uploading') {
					continue
				}
				(newState ??= new Map(previousState.state)).set(fileId, {
					readyState: 'success',
					file: previousFileState.file,
					metadata: previousFileState.metadata,
					previewUrl: previousFileState.previewUrl,
					result,
					uploader: previousFileState.uploader,
				})
			}
			break
		}
		case 'finishWithError': {
			for (const errorSpec of action.error) {
				let fileOrId: File | FileId
				let rawError: unknown

				if (Array.isArray(errorSpec)) {
					[fileOrId, rawError] = errorSpec
				} else {
					fileOrId = errorSpec
					rawError = undefined
				}

				const errors: FileUploadError[] = []

				if (rawError instanceof FileUploadError) {
					errors.push(rawError)
				} else if (Array.isArray(rawError)) {
					for (const error of rawError) {
						if (error instanceof FileUploadError) {
							errors.push(error)
						}
					}
				}

				const fileId = toFileId(previousState, fileOrId)
				const previousFileState = (newState ?? previousState.state).get(fileId)
				if (
					previousFileState === undefined ||
					(previousFileState.readyState !== 'initializing' && previousFileState.readyState !== 'uploading')
				) {
					continue
				}
				const uploader = previousFileState.readyState === 'uploading' ? previousFileState.uploader : undefined
				const metadata = previousFileState.readyState === 'uploading' ? previousFileState.metadata : undefined
				;(newState ??= new Map(previousState.state)).set(fileId, {
					readyState: 'error',
					errors: errors.length ? errors : undefined,
					rawError,
					file: previousFileState.file,
					metadata,
					previewUrl: previousFileState.previewUrl,
					uploader,
				})
			}
			break
		}
		case 'purge': {
			for (const fileOrId of action.files) {
				const fileId = toFileId(previousState, fileOrId)
				const fileState = (newState ?? previousState.state).get(fileId)

				if (fileState === undefined) {
					continue
				}
				URL.revokeObjectURL(fileState.previewUrl)
				if (fileState.readyState === 'initializing' || fileState.readyState === 'uploading') {
					fileState.abortController.abort() // This is a bit naughty… We shouldn't do this from here.
				}
				(newState ??= new Map(previousState.state)).delete(fileId)
			}
			break
		}
		case 'updateUploadProgress': {
			for (const [fileOrId, { progress }] of action.progress) {
				const fileId = toFileId(previousState, fileOrId)
				const previousFileState = (newState ?? previousState.state).get(fileId)
				if (progress === undefined || previousFileState === undefined || previousFileState.readyState !== 'uploading') {
					continue
				}
				const roundedProgress = Math.floor(progress) // throttling
				if (roundedProgress === previousFileState.progress) {
					continue
				}
				(newState ??= new Map(previousState.state)).set(fileId, {
					readyState: 'uploading',
					file: previousFileState.file,
					uploader: previousFileState.uploader,
					abortController: previousFileState.abortController,
					previewUrl: previousFileState.previewUrl,
					metadata: previousFileState.metadata,
					progress: roundedProgress,
				})
			}
			break
		}
		default:
			assertNever(action)
	}
	if (newState === undefined) {
		return previousState
	}
	return { ...previousState, state: newState }
}
