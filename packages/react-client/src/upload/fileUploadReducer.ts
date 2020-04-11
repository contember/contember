import { assertNever } from '../utils'
import { FileUploadAction } from './FileUploadAction'
import { FileUploadActionType } from './FileUploadActionType'
import { FileUploadCompoundState } from './FileUploadCompoundState'
import { FileUploadMultiTemporalState } from './FileUploadMultiTemporalState'
import { FileUploadReadyState } from './FileUploadReadyState'

export const initializeFileUploadState = (): FileUploadMultiTemporalState => ({
	lastUpdateTime: 0,
	liveState: new Map(),
	publicState: new Map(),
})

export const fileUploadReducer = (
	previousState: FileUploadMultiTemporalState,
	action: FileUploadAction,
): FileUploadMultiTemporalState => {
	const publishNewLiveState = (liveState: FileUploadCompoundState): FileUploadMultiTemporalState => ({
		publicState: liveState,
		lastUpdateTime: Date.now(),
		liveState,
	})
	switch (action.type) {
		case FileUploadActionType.PublishNewestState: {
			return publishNewLiveState(new Map(previousState.liveState))
		}
		case FileUploadActionType.StartUploading: {
			const newLiveState: FileUploadCompoundState = new Map(previousState.liveState)
			for (const [file, metadata] of action.files) {
				const previousFileState = newLiveState.get(file)

				if (previousFileState !== undefined) {
					continue
				}

				newLiveState.set(file, {
					readyState: FileUploadReadyState.Uploading,
					abortController: metadata.abortController,
					previewUrl: metadata.previewUrl,
					uploader: metadata.uploader,
					file,
				})
			}
			return publishNewLiveState(newLiveState)
		}
		case FileUploadActionType.FinishSuccessfully: {
			const newLiveState: FileUploadCompoundState = new Map(previousState.liveState)
			for (const [file, result] of action.result) {
				const previousFileState = newLiveState.get(file)
				if (previousFileState === undefined || previousFileState.readyState !== FileUploadReadyState.Uploading) {
					continue
				}
				newLiveState.set(file, {
					readyState: FileUploadReadyState.Success,
					previewUrl: previousFileState.previewUrl,
					uploader: previousFileState.uploader,
					result,
					file,
				})
			}
			return publishNewLiveState(newLiveState)
		}
		case FileUploadActionType.FinishWithError: {
			const newLiveState: FileUploadCompoundState = new Map(previousState.liveState)
			for (const [file, error] of action.error) {
				const previousFileState = newLiveState.get(file)
				if (previousFileState === undefined || previousFileState.readyState !== FileUploadReadyState.Uploading) {
					continue
				}
				newLiveState.set(file, {
					readyState: FileUploadReadyState.Error,
					previewUrl: previousFileState.previewUrl,
					uploader: previousFileState.uploader,
					error,
					file,
				})
			}
			return publishNewLiveState(newLiveState)
		}
		case FileUploadActionType.Abort: {
			const newLiveState: FileUploadCompoundState = new Map(previousState.liveState)
			for (const file of action.files) {
				newLiveState.delete(file)
			}
			return publishNewLiveState(newLiveState)
		}
		case FileUploadActionType.UpdateUploadProgress: {
			const newLiveState: FileUploadCompoundState = new Map(previousState.liveState)
			for (const [file, { progress }] of action.progress) {
				const previousFileState = newLiveState.get(file)
				if (
					progress === undefined ||
					previousFileState === undefined ||
					previousFileState.readyState !== FileUploadReadyState.Uploading
				) {
					continue
				}
				newLiveState.set(file, {
					...previousFileState,
					progress,
				})
			}
			return publishNewLiveState(newLiveState)
		}
	}
	assertNever(action)
}
