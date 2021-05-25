import type { FileId } from './FileId'
import type { FileUploadMultiTemporalState } from './FileUploadMultiTemporalState'

export const toFileId = (state: FileUploadMultiTemporalState, fileOrId: File | FileId) => {
	if (fileOrId instanceof File) {
		return state.fileIdByFile.get(fileOrId)! // Should we throw instead of the yolo "!"?
	}
	return fileOrId
}
