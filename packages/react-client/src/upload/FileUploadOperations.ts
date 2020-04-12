import { FileUploader } from '@contember/client'

export interface StartUploadOptions {
	uploader?: FileUploader
}

export type StartUpload = (files: Iterable<File>, options?: StartUploadOptions) => void
export type AbortUpload = (files: Iterable<File>) => void

export interface FileUploadOperations {
	startUpload: StartUpload
	abortUpload: AbortUpload
}
