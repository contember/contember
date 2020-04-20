import { assertNever } from '../utils'
import { FileId } from './FileId'
import { FileUploadAction } from './FileUploadAction'
import { FileUploadActionType } from './FileUploadActionType'
import { FileUploadMultiTemporalState } from './FileUploadMultiTemporalState'
import { FileUploadReadyState } from './FileUploadReadyState'
import { toFileId } from './toFileId'

export const initializeFileUploadState = (): FileUploadMultiTemporalState => ({
	lastUpdateTime: 0,
	stockFileIdSeed: 0,
	fileIdByFile: new WeakMap<File, FileId>(),
	liveState: new Map(),
	publicState: new Map(),
	isLiveStateDirty: false,
})

export const fileUploadReducer = (
	previousState: FileUploadMultiTemporalState,
	action: FileUploadAction,
): FileUploadMultiTemporalState => {
	let newStockFileIdSeed = previousState.stockFileIdSeed
	const publishNewState = (): FileUploadMultiTemporalState => ({
		publicState: previousState.liveState,
		stockFileIdSeed: newStockFileIdSeed,
		fileIdByFile: previousState.fileIdByFile,
		lastUpdateTime: previousState.lastUpdateTime,
		isLiveStateDirty: false,

		// Immediately make the live state referentially unequal so that this doesn't have to happen during each action
		// several times between two publishes.
		liveState: new Map(previousState.liveState),
	})
	const getNewDirtyState = (): FileUploadMultiTemporalState => ({
		...previousState,
		isLiveStateDirty: true,
		lastUpdateTime: Date.now(),
	})
	switch (action.type) {
		case FileUploadActionType.PublishNewestState: {
			return publishNewState()
		}
		case FileUploadActionType.StartUploading: {
			for (const [fileWithMaybeId, metadata] of action.files) {
				let file: File
				let fileId: FileId

				if (fileWithMaybeId instanceof File) {
					file = fileWithMaybeId
					fileId = `__contember__file-${newStockFileIdSeed++}`
				} else {
					;[fileId, file] = fileWithMaybeId
				}

				// Deliberately allowing starting a new upload with the same id

				previousState.liveState.set(fileId, {
					readyState: FileUploadReadyState.Uploading,
					abortController: metadata.abortController,
					previewUrl: metadata.previewUrl,
					uploader: metadata.uploader,
					file,
				})
				previousState.fileIdByFile.set(file, fileId)
			}
			return publishNewState() // Making the feedback about started upload immediate
		}
		case FileUploadActionType.FinishSuccessfully: {
			for (const [fileOrId, result] of action.result) {
				const fileId = toFileId(previousState, fileOrId)
				const previousFileState = previousState.liveState.get(fileId)
				if (previousFileState === undefined || previousFileState.readyState !== FileUploadReadyState.Uploading) {
					continue
				}
				previousState.liveState.set(fileId, {
					readyState: FileUploadReadyState.Success,
					previewUrl: previousFileState.previewUrl,
					uploader: previousFileState.uploader,
					file: previousFileState.file,
					result,
				})
			}
			// return publishNewState() // Making the feedback about successful upload immediate.
			return getNewDirtyState()
		}
		case FileUploadActionType.FinishWithError: {
			for (const [fileOrId, error] of action.error) {
				const fileId = toFileId(previousState, fileOrId)
				const previousFileState = previousState.liveState.get(fileId)
				if (previousFileState === undefined || previousFileState.readyState !== FileUploadReadyState.Uploading) {
					continue
				}
				previousState.liveState.set(fileId, {
					readyState: FileUploadReadyState.Error,
					previewUrl: previousFileState.previewUrl,
					uploader: previousFileState.uploader,
					file: previousFileState.file,
					error,
				})
			}
			return getNewDirtyState() // Bad news can wait.
		}
		case FileUploadActionType.Abort: {
			let atLeastOneAborted = false
			for (const fileOrId of action.files) {
				const fileId = toFileId(previousState, fileOrId)
				const fileState = previousState.liveState.get(fileId)

				if (fileState === undefined) {
					continue
				}
				atLeastOneAborted = true
				if (fileState.readyState === FileUploadReadyState.Uploading) {
					fileState.abortController.abort() // This is a bit naughty… We shouldn't do this from here.
				}
				previousState.liveState.delete(fileId)
			}
			if (atLeastOneAborted) {
				return getNewDirtyState()
			}
			return previousState
		}
		case FileUploadActionType.UpdateUploadProgress: {
			for (const [fileOrId, { progress }] of action.progress) {
				const fileId = toFileId(previousState, fileOrId)
				const previousFileState = previousState.liveState.get(fileId)
				if (
					progress === undefined ||
					previousFileState === undefined ||
					previousFileState.readyState !== FileUploadReadyState.Uploading
				) {
					continue
				}
				previousState.liveState.set(fileId, {
					readyState: FileUploadReadyState.Uploading,
					file: previousFileState.file,
					uploader: previousFileState.uploader,
					abortController: previousFileState.abortController,
					previewUrl: previousFileState.previewUrl,
					progress,
				})
			}
			return getNewDirtyState()
		}
	}
	assertNever(action)
}
