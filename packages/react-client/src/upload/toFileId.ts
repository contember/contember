import type { FileId } from './FileId'
import type { FileUploadMultiTemporalState } from './FileUploadMultiTemporalState'

export const toFileId = <Result = unknown, Metadata = undefined>(
	state: FileUploadMultiTemporalState<Result, Metadata>,
	fileOrId: File | FileId,
): FileId => {
	if (fileOrId instanceof File) {
		return state.fileIdByFile.get(fileOrId)! // Should we throw instead of the yolo "!"?
	}
	return fileOrId
}
