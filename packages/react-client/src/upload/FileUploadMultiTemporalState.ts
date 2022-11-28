import type { FileId } from './FileId'
import type { FileUploadCompoundState } from './FileUploadCompoundState'

export interface FileUploadMultiTemporalState<Result = unknown, Metadata = undefined> {
	fileIdByFile: WeakMap<File, FileId>
	state: FileUploadCompoundState<Result, Metadata>
}
