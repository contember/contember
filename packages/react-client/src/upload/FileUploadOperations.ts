import { FileId } from './FileId'

export type StartUpload = (
	files: Array<{
		id: FileId
		file: File
	}>,
) => void
export type CancelUpload = (fileIds: FileId[]) => void

export interface FileUploadOperations {
	startUpload: StartUpload
	cancelUpload: CancelUpload
}
