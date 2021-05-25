import type { GraphQlClient } from '../../graphQlClient'
import type { FileUploadError } from './FileUploadError'
import type { FileUploadProgress } from './FileUploadProgress'
import type { UploadedFileMetadata } from './UploadedFileMetadata'

export interface FileUploader<Result = any, Error extends FileUploadError = FileUploadError> {
	upload: (files: Map<File, UploadedFileMetadata>, options: FileUploaderInitializeOptions) => Promise<void>
}

export interface FileUploaderInitializeOptions<Result = any, Error extends FileUploadError = FileUploadError> {
	contentApiClient?: GraphQlClient
	onSuccess: (result: Iterable<[File, Result]>) => void
	onError?: (error: Iterable<File | [File, Error]>) => void
	onProgress?: (progress: Iterable<[File, FileUploadProgress]>) => void
}
