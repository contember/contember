import { FileUploader } from '@contember/client'

export type StartUpload = (files: Iterable<File>, uploader?: FileUploader) => void
export type AbortUpload = (files: Iterable<File>) => void

export interface FileUploadOperations {
	startUpload: StartUpload
	abortUpload: AbortUpload
}
