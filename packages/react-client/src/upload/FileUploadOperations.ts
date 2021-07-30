import type { FileUploader } from '@contember/client'
import type { FileId } from './FileId'
import type { FileWithMetadata } from './FileWithMetadata'

export interface StartUploadFileOptions<Metadata = undefined> {
	metadata?: Metadata
	uploader?: FileUploader
}

export type InitializeUpload = (files: Iterable<[FileId, File] | File>) => Map<FileId, FileWithMetadata>
export type StartUpload<Metadata = undefined> = (
	files: Iterable<FileId | File | [FileId | File, StartUploadFileOptions<Metadata>]>,
) => void
export type PurgeUpload = (files: Iterable<FileId | File>) => void
export type FailUpload = (files: Iterable<FileId | File | [FileId | File, any]>) => void

export interface FileUploadOperations<Metadata = undefined> {
	initializeUpload: InitializeUpload
	startUpload: StartUpload<Metadata>
	purgeUpload: PurgeUpload
	failUpload: FailUpload
}
