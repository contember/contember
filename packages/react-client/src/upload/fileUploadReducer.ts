import { assertNever } from '../utils'
import { FileUploadAction } from './FileUploadAction'
import { FileUploadActionType } from './FileUploadActionType'
import { FileUploadCompoundState } from './FileUploadCompoundState'
import { FileUploadMultiTemporalState } from './FileUploadMultiTemporalState'
import { FileUploadReadyState } from './FileUploadReadyState'

export const initializeFileUploadState = (): FileUploadMultiTemporalState => ({
	lastUpdateTime: 0,
	liveState: {},
	publicState: {},
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
			if (previousState.liveState === previousState.publicState) {
				return previousState
			}
			return publishNewLiveState({ ...previousState.liveState })
		}
		case FileUploadActionType.Initialize: {
			const relevantFiles: FileUploadCompoundState = {}
			for (const file of action.filesWithMetadata) {
				relevantFiles[file.id] = {
					readyState: FileUploadReadyState.Initializing,
					previewUrl: file.previewUrl,
				}
			}
			return publishNewLiveState({
				...previousState.liveState,
				...relevantFiles,
			})
		}
		case FileUploadActionType.FinishSuccessfully: {
			const previousFileState = previousState.liveState[action.fileId]
			if (previousFileState.readyState !== FileUploadReadyState.Uploading) {
				return previousState
			}
			return publishNewLiveState({
				...previousState.liveState,
				[action.fileId]: {
					readyState: FileUploadReadyState.Success,
					previewUrl: previousFileState.previewUrl,
					fileUrl: action.fileUrl,
				},
			})
		}
		case FileUploadActionType.UpdateUploadProgress: {
			const previousFileState = previousState.liveState[action.fileId]
			if (previousFileState.readyState === FileUploadReadyState.Uploading) {
				return {
					...previousState,
					liveState: {
						...previousState.liveState,
						[action.fileId]: {
							readyState: FileUploadReadyState.Uploading,
							previewUrl: previousFileState.previewUrl,
							progress: action.progress,
						},
					},
				}
			}
			return previousState
		}
	}
	const fileIds = action.fileIds

	switch (action.type) {
		case FileUploadActionType.FinishWithError: {
			const relevantFiles: FileUploadCompoundState = {}
			for (const fileId of fileIds) {
				relevantFiles[fileId] = {
					readyState: FileUploadReadyState.Error,
					previewUrl: previousState.liveState[fileId].previewUrl,
				}
			}
			return publishNewLiveState({
				...previousState.liveState,
				...relevantFiles,
			})
		}
		case FileUploadActionType.StartUploading: {
			const relevantFiles: FileUploadCompoundState = {}
			for (const fileId of fileIds) {
				const previousFileState = previousState.liveState[fileId]

				if (previousFileState.readyState !== FileUploadReadyState.Initializing) {
					continue
				}

				relevantFiles[fileId] = {
					readyState: FileUploadReadyState.Uploading,
					previewUrl: previousFileState.previewUrl!,
					progress: 0,
				}
			}
			return publishNewLiveState({
				...previousState.liveState,
				...relevantFiles,
			})
		}
		case FileUploadActionType.Uninitialize: {
			for (const fileId of fileIds) {
				delete previousState.liveState[fileId]
			}
			return publishNewLiveState({
				...previousState.liveState,
			})
		}
	}
	assertNever(action)
}
