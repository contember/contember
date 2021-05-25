import type { FileId } from './FileId'
import type { FileUploadCompoundState } from './FileUploadCompoundState'

export interface FileUploadMultiTemporalState {
	lastUpdateTime: number
	stockFileIdSeed: number
	isLiveStateDirty: boolean
	fileIdByFile: WeakMap<File, FileId>
	publicState: FileUploadCompoundState
	liveState: FileUploadCompoundState
}
