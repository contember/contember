import { FileId } from './FileId'
import { FileUploadCompoundState } from './FileUploadCompoundState'

export interface FileUploadMultiTemporalState {
	lastUpdateTime: number
	stockFileIdSeed: number
	fileIdByFile: WeakMap<File, FileId>
	publicState: FileUploadCompoundState
	liveState: FileUploadCompoundState
}
