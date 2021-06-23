import type { FileId } from './FileId'
import type { FileUploadCompoundState } from './FileUploadCompoundState'

export interface FileUploadMultiTemporalState<Result = unknown, Metadata = undefined> {
	lastUpdateTime: number
	isLiveStateDirty: boolean
	fileIdByFile: WeakMap<File, FileId>
	publicState: FileUploadCompoundState<Result, Metadata>
	liveState: FileUploadCompoundState<Result, Metadata>
}
