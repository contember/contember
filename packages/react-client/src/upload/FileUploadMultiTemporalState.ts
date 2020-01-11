import { FileUploadCompoundState } from './FileUploadCompoundState'

export interface FileUploadMultiTemporalState {
	lastUpdateTime: number
	publicState: FileUploadCompoundState
	liveState: FileUploadCompoundState
}
