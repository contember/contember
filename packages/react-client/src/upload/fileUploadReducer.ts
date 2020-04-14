import { assertNever } from '../utils'
import { FileId } from './FileId'
import { FileUploadAction } from './FileUploadAction'
import { FileUploadActionType } from './FileUploadActionType'
import { FileUploadCompoundState } from './FileUploadCompoundState'
import { FileUploadMultiTemporalState } from './FileUploadMultiTemporalState'
import { FileUploadReadyState } from './FileUploadReadyState'

export const initializeFileUploadState = (): FileUploadMultiTemporalState => ({
	lastUpdateTime: 0,
	stockFileIdSeed: 0,
	fileIdByFile: new WeakMap<File, FileId>(),
	liveState: new Map(),
	publicState: new Map(),
})

export const fileUploadReducer = (
	previousState: FileUploadMultiTemporalState,
	action: FileUploadAction,
): FileUploadMultiTemporalState => {
	let newStockFileIdSeed = previousState.stockFileIdSeed
	const publishNewLiveState = (liveState: FileUploadCompoundState): FileUploadMultiTemporalState => ({
		publicState: liveState,
		stockFileIdSeed: newStockFileIdSeed,
		fileIdByFile: previousState.fileIdByFile,
		lastUpdateTime: Date.now(),
		liveState,
	})
	const toFileId = (fileOrId: File | FileId) => {
		if (fileOrId instanceof File) {
			return previousState.fileIdByFile.get(fileOrId)! // Should we throw instead of the yolo "!"?
		}
		return fileOrId
	}
	switch (action.type) {
		case FileUploadActionType.PublishNewestState: {
			return publishNewLiveState(new Map(previousState.liveState))
		}
		case FileUploadActionType.StartUploading: {
			const newLiveState: FileUploadCompoundState = new Map(previousState.liveState)

			for (const [fileWithMaybeId, metadata] of action.files) {
				let file: File
				let fileId: FileId

				if (fileWithMaybeId instanceof File) {
					file = fileWithMaybeId
					fileId = `file-${newStockFileIdSeed++}`
				} else {
					;[fileId, file] = fileWithMaybeId
				}

				// Deliberately allowing starting a new upoad with the same id

				newLiveState.set(fileId, {
					readyState: FileUploadReadyState.Uploading,
					abortController: metadata.abortController,
					previewUrl: metadata.previewUrl,
					uploader: metadata.uploader,
					file,
				})
				previousState.fileIdByFile.set(file, fileId)
			}
			return publishNewLiveState(newLiveState)
		}
		case FileUploadActionType.FinishSuccessfully: {
			const newLiveState: FileUploadCompoundState = new Map(previousState.liveState)
			for (const [fileOrId, result] of action.result) {
				const fileId = toFileId(fileOrId)
				const previousFileState = newLiveState.get(fileId)
				if (previousFileState === undefined || previousFileState.readyState !== FileUploadReadyState.Uploading) {
					continue
				}
				newLiveState.set(fileId, {
					readyState: FileUploadReadyState.Success,
					previewUrl: previousFileState.previewUrl,
					uploader: previousFileState.uploader,
					file: previousFileState.file,
					result,
				})
			}
			return publishNewLiveState(newLiveState)
		}
		case FileUploadActionType.FinishWithError: {
			const newLiveState: FileUploadCompoundState = new Map(previousState.liveState)
			for (const [fileOrId, error] of action.error) {
				const fileId = toFileId(fileOrId)
				const previousFileState = newLiveState.get(fileId)
				if (previousFileState === undefined || previousFileState.readyState !== FileUploadReadyState.Uploading) {
					continue
				}
				newLiveState.set(fileId, {
					readyState: FileUploadReadyState.Error,
					previewUrl: previousFileState.previewUrl,
					uploader: previousFileState.uploader,
					file: previousFileState.file,
					error,
				})
			}
			return publishNewLiveState(newLiveState)
		}
		case FileUploadActionType.Abort: {
			const newLiveState: FileUploadCompoundState = new Map(previousState.liveState)
			for (const fileOrId of action.files) {
				newLiveState.delete(toFileId(fileOrId))
			}
			return publishNewLiveState(newLiveState)
		}
		case FileUploadActionType.UpdateUploadProgress: {
			const newLiveState: FileUploadCompoundState = new Map(previousState.liveState)
			for (const [fileOrId, { progress }] of action.progress) {
				const fileId = toFileId(fileOrId)
				const previousFileState = newLiveState.get(fileId)
				if (
					progress === undefined ||
					previousFileState === undefined ||
					previousFileState.readyState !== FileUploadReadyState.Uploading
				) {
					continue
				}
				newLiveState.set(fileId, {
					readyState: FileUploadReadyState.Uploading,
					file: previousFileState.file,
					uploader: previousFileState.uploader,
					abortController: previousFileState.abortController,
					previewUrl: previousFileState.previewUrl,
					progress,
				})
			}
			return { ...previousState, liveState: newLiveState }
		}
	}
	assertNever(action)
}
