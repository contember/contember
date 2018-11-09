import { Action, handleActions } from 'redux-actions'
import { AnyUpload, default as UploadState, emptyUploadState, UploadPreparing, UploadStatus } from '../state/upload'
import { Reducer } from 'redux'

export const UPLOAD_START = 'upload_start'
export const UPLOAD_UPDATE_PROGRESS = 'upload_update_progress'
export const UPLOAD_FINISH = 'upload_finish'
export const UPLOAD_SET_FAILURE = 'upload_set_failure'

export type UploadStartPayload = { id: string; data: UploadPreparing }
export type UploadUpdateProgressPayload = { id: string; progress: number | null }
export type UploadFinishPayload = { id: string; resultUrl: string }
export type UploadSetFailurePayload = { id: string; reason: string }

const updateUploadStatus = (state: UploadState, id: string, updater: (upload: AnyUpload) => AnyUpload): UploadState => {
	if (!state.uploads[id]) {
		return state
	}
	return {
		...state,
		uploads: {
			...state.uploads,
			[id]: { ...state.uploads[id], ...updater(state.uploads[id]) }
		}
	}
}

export default handleActions<UploadState, any>(
	{
		[UPLOAD_START]: (state, action: Action<UploadStartPayload>) => {
			const { id, data } = action.payload!
			return { ...state, uploads: { ...state.uploads, [id]: data } }
		},
		[UPLOAD_UPDATE_PROGRESS]: (state, action: Action<UploadUpdateProgressPayload>) => {
			const { id, progress } = action.payload!
			return updateUploadStatus(state, id, upload => ({ ...upload, status: UploadStatus.UPLOADING, progress }))
		},
		[UPLOAD_FINISH]: (state, action: Action<UploadFinishPayload>) => {
			const { id, resultUrl } = action.payload!
			return updateUploadStatus(state, id, upload => ({ ...upload, status: UploadStatus.FINISHED, resultUrl }))
		},
		[UPLOAD_SET_FAILURE]: (state, action: Action<UploadSetFailurePayload>) => {
			const { id, reason } = action.payload!
			return updateUploadStatus(state, id, upload => ({ ...upload, status: UploadStatus.FAILED, reason }))
		}
	},
	emptyUploadState
) as Reducer
