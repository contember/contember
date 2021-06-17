import { FileUploadError } from '@contember/client'
import { assertNever } from '../utils'
import type { FileId } from './FileId'
import type { FileUploadAction } from './FileUploadAction'
import type { FileUploadMultiTemporalState } from './FileUploadMultiTemporalState'
import { toFileId } from './toFileId'

export const initializeFileUploadState = <Result = unknown, Metadata = undefined>(): FileUploadMultiTemporalState<
	Result,
	Metadata
> => ({
	lastUpdateTime: 0,
	fileIdByFile: new WeakMap<File, FileId>(),
	liveState: new Map(),
	publicState: new Map(),
	isLiveStateDirty: false,
})

export const fileUploadReducer = <Result = unknown, Metadata = undefined>(
	previousState: FileUploadMultiTemporalState<Result, Metadata>,
	action: FileUploadAction<Result, Metadata>,
): FileUploadMultiTemporalState<Result, Metadata> => {
	const publishNewState = (): FileUploadMultiTemporalState<Result, Metadata> => ({
		publicState: previousState.liveState,
		fileIdByFile: previousState.fileIdByFile,
		lastUpdateTime: previousState.lastUpdateTime,
		isLiveStateDirty: false,

		// Immediately make the live state referentially unequal so that this doesn't have to happen during each action
		// several times between two publishes.
		liveState: new Map(previousState.liveState),
	})
	const getNewDirtyState = (): FileUploadMultiTemporalState<Result, Metadata> => ({
		fileIdByFile: previousState.fileIdByFile,
		liveState: previousState.liveState,
		publicState: previousState.publicState,
		isLiveStateDirty: true,
		lastUpdateTime: Date.now(),
	})
	switch (action.type) {
		case 'publishNewestState': {
			return publishNewState()
		}
		case 'initialize': {
			for (const [fileId, metadata] of action.files) {
				// Deliberately allowing starting a new upload with the same id

				previousState.liveState.set(fileId, {
					readyState: 'initializing',
					abortController: metadata.abortController,
					previewUrl: metadata.previewUrl,
					file: metadata.file,
				})
				previousState.fileIdByFile.set(metadata.file, fileId)
			}
			return publishNewState() /* Making the feedback about new files immediate*/
		}
		case 'startUploading': {
			for (const [fileOrId, metadata] of action.files) {
				const fileId = toFileId(previousState, fileOrId)
				const fileState = previousState.liveState.get(fileId)

				if (fileState === undefined || fileState.readyState !== 'initializing') {
					continue
				}

				previousState.liveState.set(fileId, {
					readyState: 'uploading',
					abortController: fileState.abortController,
					file: fileState.file,
					metadata: metadata.metadata!, // If the user didn't supply the metadata, then that's on them.
					previewUrl: fileState.previewUrl,
					progress: undefined,
					uploader: metadata.uploader,
				})
			}
			return publishNewState() /* Making the feedback about started upload immediate*/
		}
		case 'finishSuccessfully': {
			for (const [fileOrId, result] of action.result) {
				const fileId = toFileId(previousState, fileOrId)
				const previousFileState = previousState.liveState.get(fileId)
				if (previousFileState === undefined || previousFileState.readyState !== 'uploading') {
					continue
				}
				previousState.liveState.set(fileId, {
					readyState: 'success',
					file: previousFileState.file,
					metadata: previousFileState.metadata,
					previewUrl: previousFileState.previewUrl,
					result,
					uploader: previousFileState.uploader,
				})
			}
			// return publishNewState() // Making the feedback about successful upload immediate.
			return getNewDirtyState()
		}
		case 'finishWithError': {
			for (const errorSpec of action.error) {
				let fileOrId: File | FileId
				let error: any

				if (Array.isArray(errorSpec)) {
					;[fileOrId, error] = errorSpec
				} else {
					fileOrId = errorSpec
					error = undefined
				}

				if (!(error instanceof FileUploadError)) {
					error = undefined
				}

				const fileId = toFileId(previousState, fileOrId)
				const previousFileState = previousState.liveState.get(fileId)
				if (
					previousFileState === undefined ||
					(previousFileState.readyState !== 'initializing' && previousFileState.readyState !== 'uploading')
				) {
					continue
				}
				const uploader = previousFileState.readyState === 'uploading' ? previousFileState.uploader : undefined
				const metadata = previousFileState.readyState === 'uploading' ? previousFileState.metadata : undefined
				previousState.liveState.set(fileId, {
					readyState: 'error',
					error,
					file: previousFileState.file,
					metadata,
					previewUrl: previousFileState.previewUrl,
					uploader,
				})
			}
			return getNewDirtyState() // Bad news can wait.
		}
		case 'abort': {
			let atLeastOneAborted = false
			for (const fileOrId of action.files) {
				const fileId = toFileId(previousState, fileOrId)
				const fileState = previousState.liveState.get(fileId)

				if (fileState === undefined) {
					continue
				}
				atLeastOneAborted = true
				if (fileState.readyState === 'initializing' || fileState.readyState === 'uploading') {
					fileState.abortController.abort() // This is a bit naughty… We shouldn't do this from here.
				}
				previousState.liveState.delete(fileId)
			}
			if (atLeastOneAborted) {
				return getNewDirtyState()
			}
			return previousState
		}
		case 'updateUploadProgress': {
			for (const [fileOrId, { progress }] of action.progress) {
				const fileId = toFileId(previousState, fileOrId)
				const previousFileState = previousState.liveState.get(fileId)
				if (progress === undefined || previousFileState === undefined || previousFileState.readyState !== 'uploading') {
					continue
				}
				previousState.liveState.set(fileId, {
					readyState: 'uploading',
					file: previousFileState.file,
					uploader: previousFileState.uploader,
					abortController: previousFileState.abortController,
					previewUrl: previousFileState.previewUrl,
					metadata: previousFileState.metadata,
					progress,
				})
			}
			return getNewDirtyState()
		}
	}
	assertNever(action)
}
