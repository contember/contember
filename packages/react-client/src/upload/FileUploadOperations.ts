import type { FileUploader } from '@contember/client'
import type { FileId } from './FileId'

export interface StartUploadOptions {
	uploader?: FileUploader
}

export type StartUpload = (files: Iterable<[FileId, File] | File>, options?: StartUploadOptions) => void
export type AbortUpload = (files: Iterable<FileId | File>) => void

export interface FileUploadOperations {
	startUpload: StartUpload
	abortUpload: AbortUpload
}
